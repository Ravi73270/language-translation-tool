# 🌐 LinguaShift – Language Translation Tool
> **CodeAlpha Internship Task 1** | Built by Ravi Sahu

A clean, fully-functional web-based language translator built with **Flask + MyMemory API**.

---

## 📁 Project Structure

```
language-translation-tool/
│
├── app.py                  ← Flask backend + translation logic
├── requirements.txt        ← Python dependencies
├── README.md               ← This file
│
├── templates/
│   └── index.html          ← Main HTML UI (Jinja2 template)
│
└── static/
    ├── css/
    │   └── style.css       ← All styling (dark theme, responsive)
    └── js/
        └── main.js         ← All JS: translate, TTS, copy, swap, chips
```

---

## 🚀 How to Run

### Step 1 – Clone / Download the project
```bash
cd language-translation-tool
```

### Step 2 – Create a virtual environment
```bash
python -m venv venv
```

### Step 3 – Activate it
```bash
# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### Step 4 – Install dependencies
```bash
pip install -r requirements.txt
```

### Step 5 – Run the app
```bash
python app.py
```

### Step 6 – Open in browser
```
http://127.0.0.1:5000
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌍 38 Languages | Hindi, Spanish, French, German, Chinese, Japanese, Arabic, Russian, Tamil, and more |
| 🔁 Swap Languages | One-click to flip source ↔ target |
| 📋 Copy Button | Copy translation to clipboard instantly |
| 🔊 Text-to-Speech | Listen to both source and translated text |
| ⚡ Quick Chips | One-click language switcher bar |
| ⌨️ Keyboard Shortcut | `Ctrl + Enter` to translate |
| 📏 Character Counter | Live 0/500 counter with color warning |
| 📱 Responsive | Works on mobile and desktop |
| 🆓 No API Key | Uses MyMemory free API — no sign-up needed |

---

## 🔌 API Used

**MyMemory Translation API** (Free, no API key required)
- Endpoint: `https://api.mymemory.translated.net/get`
- Free tier: 1000 words/day
- Docs: https://mymemory.translated.net/doc/spec.php

---

## 🛠 Tech Stack

- **Backend:** Python, Flask
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Translation:** MyMemory REST API (via `requests`)
- **TTS:** Web Speech API (browser built-in)
- **Fonts:** Space Grotesk + Inter (Google Fonts)

---

## 📸 Screenshots
> Dark theme, two-panel layout, 38 language options, mobile-responsive.

---

*Built for CodeAlpha Internship – Task 1: Language Translation Tool*
