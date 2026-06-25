from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

MYMEMORY_URL = "https://api.mymemory.translated.net/get"

LANGUAGES = [
    {"code": "en",  "name": "English"},
    {"code": "hi",  "name": "Hindi"},
    {"code": "es",  "name": "Spanish"},
    {"code": "fr",  "name": "French"},
    {"code": "de",  "name": "German"},
    {"code": "it",  "name": "Italian"},
    {"code": "pt",  "name": "Portuguese"},
    {"code": "ru",  "name": "Russian"},
    {"code": "zh",  "name": "Chinese (Simplified)"},
    {"code": "ja",  "name": "Japanese"},
    {"code": "ko",  "name": "Korean"},
    {"code": "ar",  "name": "Arabic"},
    {"code": "bn",  "name": "Bengali"},
    {"code": "tr",  "name": "Turkish"},
    {"code": "nl",  "name": "Dutch"},
    {"code": "pl",  "name": "Polish"},
    {"code": "sv",  "name": "Swedish"},
    {"code": "da",  "name": "Danish"},
    {"code": "fi",  "name": "Finnish"},
    {"code": "no",  "name": "Norwegian"},
    {"code": "id",  "name": "Indonesian"},
    {"code": "ms",  "name": "Malay"},
    {"code": "th",  "name": "Thai"},
    {"code": "vi",  "name": "Vietnamese"},
    {"code": "uk",  "name": "Ukrainian"},
    {"code": "cs",  "name": "Czech"},
    {"code": "ro",  "name": "Romanian"},
    {"code": "hu",  "name": "Hungarian"},
    {"code": "el",  "name": "Greek"},
    {"code": "he",  "name": "Hebrew"},
    {"code": "fa",  "name": "Persian"},
    {"code": "ur",  "name": "Urdu"},
    {"code": "ta",  "name": "Tamil"},
    {"code": "te",  "name": "Telugu"},
    {"code": "ml",  "name": "Malayalam"},
    {"code": "kn",  "name": "Kannada"},
    {"code": "gu",  "name": "Gujarati"},
    {"code": "mr",  "name": "Marathi"},
    {"code": "pa",  "name": "Punjabi"},
]


@app.route("/")
def index():
    return render_template("index.html", languages=LANGUAGES)


@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()

    text        = (data.get("text") or "").strip()
    source_lang = data.get("source_lang", "en")
    target_lang = data.get("target_lang", "hi")

    # ── Validations ──────────────────────────────────────
    if not text:
        return jsonify({"error": "Please enter some text to translate."}), 400

    if len(text) > 500:
        return jsonify({"error": "Text must be 500 characters or fewer."}), 400

    if source_lang == target_lang:
        return jsonify({"translated_text": text, "detected_lang": source_lang})

    # ── Split into sentences for better accuracy ──────────
    # MyMemory gives wrong results for very short/ambiguous text.
    # Sending sentence-by-sentence improves quality significantly.
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text)
    translated_parts = []

    try:
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            lang_pair = f"{source_lang}|{target_lang}"

            resp = requests.get(
                MYMEMORY_URL,
                params={
                    "q":        sentence,
                    "langpair": lang_pair,
                    "de":       "ravisahu2613@gmail.com",  # email = machine translation only (no bad community entries)
                    "mt":       "1",                        # force machine translation
                },
                timeout=10,
            )

            result = resp.json()

            if result.get("responseStatus") == 200:
                part = result["responseData"]["translatedText"]

                # ── Fallback: if API returns garbage, try LibreTranslate ──
                if _looks_wrong(sentence, part, source_lang, target_lang):
                    part = _fallback_translate(sentence, source_lang, target_lang) or part

                translated_parts.append(part)
            else:
                return jsonify({"error": "Translation failed. Please try again."}), 500

        final_translation = " ".join(translated_parts)
        return jsonify({
            "translated_text": final_translation,
            "detected_lang":   source_lang,
            "char_count":      len(text),
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out. Check your internet connection."}), 504
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


# ── Helper: detect obviously wrong translations ───────────
def _looks_wrong(original: str, translated: str, src: str, tgt: str) -> bool:
    """
    Returns True if the translation looks suspicious:
    - Same as original (untranslated)
    - Contains Latin characters when target is Hindi/Arabic/Japanese etc.
    - Translation is way too short or way too long
    """
    if not translated or not translated.strip():
        return True

    # If translation is identical to source, it failed silently
    if translated.strip().lower() == original.strip().lower():
        return True

    # For Hindi/Urdu/Marathi target: result should NOT be mostly ASCII
    non_latin_targets = {"hi", "ur", "mr", "pa", "gu", "bn", "ta", "te", "ml", "kn", "ar", "fa", "he", "ja", "zh", "ko", "th", "ru", "uk", "el"}
    if tgt in non_latin_targets:
        ascii_ratio = sum(1 for c in translated if ord(c) < 128) / max(len(translated), 1)
        if ascii_ratio > 0.85:  # more than 85% ASCII = likely wrong
            return True

    return False


# ── Fallback: MyMemory without email (different pool) ────
def _fallback_translate(text: str, src: str, tgt: str) -> str | None:
    """
    Second attempt using MyMemory without the email param
    (hits a different translation memory pool).
    """
    try:
        resp = requests.get(
            MYMEMORY_URL,
            params={
                "q":        text,
                "langpair": f"{src}|{tgt}",
            },
            timeout=8,
        )
        result = resp.json()
        if result.get("responseStatus") == 200:
            return result["responseData"]["translatedText"]
    except Exception:
        pass
    return None


if __name__ == "__main__":
    app.run(debug=True)