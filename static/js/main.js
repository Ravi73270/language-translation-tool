/* =====================================================
   LinguaShift – main.js
   Handles: translate, swap, copy, TTS, char counter,
            quick chips, keyboard shortcut (Ctrl+Enter)
   ===================================================== */

(() => {
  "use strict";

  /* ── DOM refs ─────────────────────────────────────── */
  const sourceText      = document.getElementById("source-text");
  const outputArea      = document.getElementById("output-area");
  const errorArea       = document.getElementById("error-area");
  const sourceLang      = document.getElementById("source-lang");
  const targetLang      = document.getElementById("target-lang");
  const translateBtn    = document.getElementById("translate-btn");
  const btnLabel        = document.getElementById("btn-label");
  const btnArrow        = document.getElementById("btn-arrow");
  const btnSpinner      = document.getElementById("btn-spinner");
  const clearBtn        = document.getElementById("clear-btn");
  const swapBtn         = document.getElementById("swap-btn");
  const copyBtn         = document.getElementById("copy-btn");
  const copyToast       = document.getElementById("copy-toast");
  const charCounter     = document.getElementById("char-counter");
  const speakSourceBtn  = document.getElementById("speak-source-btn");
  const speakTargetBtn  = document.getElementById("speak-target-btn");
  const chips           = document.querySelectorAll(".chip");

  /* ── State ────────────────────────────────────────── */
  let lastTranslation = "";
  let copyToastTimer  = null;

  /* ── Char counter ─────────────────────────────────── */
  sourceText.addEventListener("input", () => {
    const len = sourceText.value.length;
    charCounter.textContent = `${len} / 500`;
    charCounter.classList.toggle("warn",  len > 400);
    charCounter.classList.toggle("limit", len >= 500);
  });

  /* ── Keyboard shortcut Ctrl+Enter ─────────────────── */
  sourceText.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      doTranslate();
    }
  });

  /* ── Translate button click ───────────────────────── */
  translateBtn.addEventListener("click", doTranslate);

  async function doTranslate() {
    const text = sourceText.value.trim();
    if (!text) {
      showError("Please enter some text first.");
      return;
    }

    setLoading(true);
    clearOutput();

    try {
      const res = await fetch("/translate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          text,
          source_lang: sourceLang.value,
          target_lang: targetLang.value,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        showError(data.error || "Translation failed.");
      } else {
        showTranslation(data.translated_text);
      }
    } catch (err) {
      showError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading state ────────────────────────────────── */
  function setLoading(on) {
    translateBtn.disabled = on;
    btnLabel.textContent  = on ? "Translating…" : "Translate";
    btnArrow.classList.toggle("hidden", on);
    btnSpinner.classList.toggle("hidden", !on);
  }

  /* ── Output helpers ───────────────────────────────── */
  function clearOutput() {
    errorArea.classList.add("hidden");
    errorArea.textContent = "";
    lastTranslation = "";
    outputArea.innerHTML = `<span class="output-placeholder">Translating…</span>`;
  }

  function showTranslation(text) {
    lastTranslation = text;
    outputArea.textContent = text;   // safe: sets as text, not HTML
  }

  function showError(msg) {
    errorArea.textContent = msg;
    errorArea.classList.remove("hidden");
    outputArea.innerHTML = `<span class="output-placeholder">Your translation will appear here…</span>`;
    lastTranslation = "";
  }

  /* ── Clear ────────────────────────────────────────── */
  clearBtn.addEventListener("click", () => {
    sourceText.value = "";
    charCounter.textContent = "0 / 500";
    charCounter.classList.remove("warn", "limit");
    clearOutput();
    outputArea.innerHTML = `<span class="output-placeholder">Your translation will appear here…</span>`;
    sourceText.focus();
  });

  /* ── Swap languages ───────────────────────────────── */
  swapBtn.addEventListener("click", () => {
    const srcVal = sourceLang.value;
    const tgtVal = targetLang.value;

    sourceLang.value = tgtVal;
    targetLang.value = srcVal;

    // Also swap text if there's a translation
    if (lastTranslation) {
      const prev = sourceText.value;
      sourceText.value = lastTranslation;
      charCounter.textContent = `${sourceText.value.length} / 500`;
      sourceText.dispatchEvent(new Event("input"));
      outputArea.textContent = prev;
      lastTranslation = prev;
    }

    updateChips(targetLang.value);
  });

  /* ── Copy translation ─────────────────────────────── */
  copyBtn.addEventListener("click", async () => {
    if (!lastTranslation) return;

    try {
      await navigator.clipboard.writeText(lastTranslation);
      flashCopyToast();
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = lastTranslation;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flashCopyToast();
    }
  });

  function flashCopyToast() {
    copyToast.classList.remove("hidden");
    clearTimeout(copyToastTimer);
    copyToastTimer = setTimeout(() => copyToast.classList.add("hidden"), 2200);
  }

  /* ── Text-to-Speech ───────────────────────────────── */
  function speak(text, lang) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    if (!text.trim()) return;

    window.speechSynthesis.cancel();   // stop any ongoing
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = lang;
    utter.rate  = 0.95;
    window.speechSynthesis.speak(utter);
  }

  speakSourceBtn.addEventListener("click", () => {
    speak(sourceText.value, sourceLang.value);
  });

  speakTargetBtn.addEventListener("click", () => {
    speak(lastTranslation, targetLang.value);
  });

  /* ── Quick language chips ─────────────────────────── */
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      targetLang.value = chip.dataset.lang;
      updateChips(chip.dataset.lang);
    });
  });

  targetLang.addEventListener("change", () => {
    updateChips(targetLang.value);
  });

  function updateChips(langCode) {
    chips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.lang === langCode);
    });
  }

  /* ── Initial chip state ───────────────────────────── */
  updateChips(targetLang.value);

})();
