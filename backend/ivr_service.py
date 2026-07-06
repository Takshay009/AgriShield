"""
IVR Service — Voice call flow via TwiML with mock mode.
"""
import os
import uuid
from datetime import datetime
from typing import Optional

USE_MOCK_IVR = os.getenv("USE_MOCK_IVR", "true").lower() == "true"


def generate_welcome_twiml(language: str = "hi") -> str:
    """
    Generate TwiML XML for welcome IVR prompt.
    Supports Hindi (hi), Telugu (te), Marathi (mr), English (en).
    """
    greetings = {
        "hi": "नमस्ते! कृषि शील्ड में आपका स्वागत है। अपनी फसल की जानकारी के लिए 1 दबाएं। मौसम अलर्ट के लिए 2 दबाएं। बीमा दावे के लिए 3 दबाएं।",
        "te": "నమస్కారం! ఆగ్రి షీల్డ్ కు స్వాగతం. మీ పంట సమాచారం కోసం 1 నొక్కండి. వాతావరణ హెచ్చరికల కోసం 2 నొక్కండి. బీమా క్లెయిమ్ కోసం 3 నొక్కండి.",
        "mr": "नमस्कार! अॅग्री शील्ड मध्ये आपले स्वागत आहे. पीक माहितीसाठी 1 दाबा. हवामान अलर्टसाठी 2 दाबा. विमा दाव्यासाठी 3 दाबा.",
        "en": "Welcome to AgriShield! Press 1 for crop information. Press 2 for weather alerts. Press 3 for insurance claims.",
    }

    greeting = greetings.get(language, greetings["en"])

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="{language}-IN" voice="Polly.Aditi">{greeting}</Say>
    <Gather numDigits="1" action="/webhooks/voice-menu" method="POST">
        <Say language="{language}-IN">Please press a key now.</Say>
    </Gather>
    <Say>We didn't receive any input. Goodbye!</Say>
</Response>"""
    return twiml


def generate_menu_response_twiml(digit: str, language: str = "hi") -> str:
    """Generate TwiML response based on menu selection."""
    responses = {
        "1": {
            "hi": "आपकी फसल की जानकारी तैयार की जा रही है। कृपया प्रतीक्षा करें।",
            "en": "Preparing your crop information. Please wait.",
        },
        "2": {
            "hi": "आपके क्षेत्र में अगले 7 दिनों का मौसम पूर्वानुमान।",
            "en": "Weather forecast for your area for the next 7 days.",
        },
        "3": {
            "hi": "बीमा दावा प्रक्रिया शुरू हो रही है।",
            "en": "Starting insurance claim process.",
        },
    }

    resp = responses.get(digit, {}).get(language, "Invalid option. Please try again.")

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="{language}-IN">{resp}</Say>
    <Hangup/>
</Response>"""
    return twiml


def log_call_event(call_sid: str, event: str, details: Optional[dict] = None) -> dict:
    """Log IVR call events for audit trail."""
    return {
        "call_sid": call_sid or f"CA_mock_{uuid.uuid4().hex[:12]}",
        "event": event,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
    }
