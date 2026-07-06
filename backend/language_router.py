"""
Language Router — Detect and store farmer language preference.
"""
from typing import Optional

# Keyword-based language detection
LANGUAGE_KEYWORDS = {
    "hi": ["namaste", "namaskar", "hindi", "haan", "ji", "kisan", "fasal", "mausam", "kheti"],
    "te": ["namaskaram", "telugu", "panta", "vatavaranam"],
    "mr": ["namaskar", "marathi", "shetkari", "peek", "hawaman"],
    "en": ["hello", "hi", "yes", "help", "crop", "weather", "insurance", "english"],
}


def detect_language(text: str) -> str:
    """
    Detect language from text using keyword matching.
    Returns language code: hi, te, mr, en.
    Defaults to 'hi' (Hindi) for maximum rural reach.
    """
    text_lower = text.lower().strip()

    scores = {}
    for lang, keywords in LANGUAGE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[lang] = score

    if scores:
        return max(scores, key=scores.get)

    # Default to Hindi
    return "hi"


def get_language_name(code: str) -> str:
    """Human-readable language name."""
    names = {
        "hi": "Hindi",
        "te": "Telugu",
        "mr": "Marathi",
        "en": "English",
    }
    return names.get(code, "Unknown")
