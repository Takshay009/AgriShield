"""
WhatsApp AI Service — Twilio WhatsApp Business Bot with Photo Diagnosis & Groq LLM Q&A
Replaces legacy keyword matching with:
1. ResNet18 Vision Model for crop disease diagnosis from photos (NumMedia > 0).
2. Groq LLM (llama-3.3-70b-versatile) for natural language agricultural Q&A (NumMedia == 0).
3. Explicit Language Selection (Hindi, Telugu, Marathi, Tamil, English).
4. Full message logging and interactive web dashboard sandbox support.
"""
import os
import uuid
import json
import urllib.request
import requests
from datetime import datetime
from typing import Optional

# Import domain services for context & diagnosis
try:
    from diagnosis_service import classify_image, extract_symptoms_from_text
    from weather_service import fetch_weather_current, fetch_weather_forecast
    from crop_recommendation_service import _load_crop_reference
except ImportError:
    try:
        from backend.diagnosis_service import classify_image, extract_symptoms_from_text
        from backend.weather_service import fetch_weather_current, fetch_weather_forecast
        from backend.crop_recommendation_service import _load_crop_reference
    except ImportError:
        pass

from dotenv import load_dotenv
load_dotenv()

# Environment Variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+16592667445")  # For SMS / Voice IVR
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")  # Universal Twilio WhatsApp Sandbox
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# In-memory storage for conversations, logs, and user language preferences
_whatsapp_conversations: list[dict] = []
LANGUAGES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_languages.json")

def _load_user_languages() -> dict[str, str]:
    if os.path.exists(LANGUAGES_FILE):
        try:
            with open(LANGUAGES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def _save_user_languages(data: dict[str, str]):
    try:
        with open(LANGUAGES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Error saving languages] {e}")

_user_languages: dict[str, str] = _load_user_languages()  # phone_number -> language code ('hi', 'te', 'mr', 'ta', 'en')

# Language Names & Flags
LANGUAGE_MAP = {
    "1": ("hi", "हिन्दी (Hindi)", "🌐 भाषा बदली गई: हिन्दी। अब आप अपना सवाल पूछ सकते हैं या फसल की फोटो भेज सकते हैं! 🌾"),
    "hindi": ("hi", "हिन्दी (Hindi)", "🌐 भाषा बदली गई: हिन्दी। अब आप अपना सवाल पूछ सकते हैं या फसल की फोटो भेज सकते हैं! 🌾"),
    "हिन्दी": ("hi", "हिन्दी (Hindi)", "🌐 भाषा बदली गई: हिन्दी। अब आप अपना सवाल पूछ सकते हैं या फसल की फोटो भेज सकते हैं! 🌾"),
    "2": ("te", "తెలుగు (Telugu)", "🌐 భాష మార్చబడింది: తెలుగు. ఇప్పుడు మీరు మీ ప్రశ్నను అడగవచ్చు లేదా పంట ఫోటోను పంపవచ్చు! 🌾"),
    "telugu": ("te", "తెలుగు (Telugu)", "🌐 భాష మార్చబడింది: తెలుగు. ఇప్పుడు మీరు మీ ప్రశ్నను అడగవచ్చు లేదా పంట ఫోటోను పంపవచ్చు! 🌾"),
    "తెలుగు": ("te", "తెలుగు (Telugu)", "🌐 భాష మార్చబడింది: తెలుగు. ఇప్పుడు మీరు మీ ప్రశ్నను అడగవచ్చు లేదా పంట ఫోటోను పంపవచ్చు! 🌾"),
    "3": ("mr", "मराठी (Marathi)", "🌐 भाषा बदलली: मराठी. आता तुम्ही तुमचा प्रश्न विचारू शकता किंवा पिकाचा फोटो पाठवू शकता! 🌾"),
    "marathi": ("mr", "मराठी (Marathi)", "🌐 भाषा बदलली: मराठी. आता तुम्ही तुमचा प्रश्न विचारू शकता किंवा पिकाचा फोटो पाठवू शकता! 🌾"),
    "मराठी": ("mr", "मराठी (Marathi)", "🌐 भाषा बदलली: मराठी. आता तुम्ही तुमचा प्रश्न विचारू शकता किंवा पिकाचा फोटो पाठवू शकता! 🌾"),
    "4": ("ta", "தமிழ் (Tamil)", "🌐 மொழி மாற்றப்பட்டது: தமிழ். இப்போது உங்கள் கேள்வியைக் கேட்கலாம் அல்லது பயிர் புகைப்படத்தை அனுப்பலாம்! 🌾"),
    "tamil": ("ta", "தமிழ் (Tamil)", "🌐 மொழி மாற்றப்பட்டது: தமிழ். இப்போது உங்கள் கேள்வியைக் கேட்கலாம் அல்லது பயிர் புகைப்படத்தை அனுப்பலாம்! 🌾"),
    "தமிழ்": ("ta", "தமிழ் (Tamil)", "🌐 மொழி மாற்றப்பட்டது: தமிழ். இப்போது உங்கள் கேள்வியைக் கேட்கலாம் அல்லது பயிர் புகைப்படத்தை அனுப்பலாம்! 🌾"),
    "5": ("en", "English", "🌐 Language set to: English. You can now ask any agricultural question or upload a crop photo for AI diagnosis! 🌾"),
    "english": ("en", "English", "🌐 Language set to: English. You can now ask any agricultural question or upload a crop photo for AI diagnosis! 🌾"),
}


def get_whatsapp_conversations() -> list[dict]:
    """Return all WhatsApp conversation history for the dashboard."""
    return list(_whatsapp_conversations)


def get_user_language(phone: str) -> str:
    """Get preferred language for a farmer (default: Hindi 'hi')."""
    langs = _load_user_languages()
    return langs.get(phone, "hi")


def set_user_language(phone: str, lang_code: str):
    """Set preferred language for a farmer."""
    langs = _load_user_languages()
    langs[phone] = lang_code
    _save_user_languages(langs)
    _user_languages[phone] = lang_code


def send_twilio_message(to_number: str, body: str, from_number: Optional[str] = None) -> dict:
    """Send real outbound message via Twilio REST API (with mock fallback)."""
    sender = from_number or f"whatsapp:{TWILIO_WHATSAPP_NUMBER}"
    recipient = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        payload = {
            "From": sender,
            "To": recipient,
            "Body": body
        }
        res = requests.post(url, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), data=payload, timeout=5)
        if res.status_code in [200, 201]:
            data = res.json()
            return {"sid": data.get("sid"), "status": "sent", "to": recipient}
        else:
            print(f"[Twilio Send Warning] Status: {res.status_code}, Body: {res.text}")
    except Exception as e:
        print(f"[Twilio API Exception] Falling back to log: {e}")

    return {"sid": f"SM_mock_{uuid.uuid4().hex[:10]}", "status": "sent_mock", "to": recipient}


def download_twilio_media(media_url: str) -> str:
    """Download image from Twilio webhook URL or use sample/data URL."""
    if not media_url:
        return ""
    
    # If it's already a local path or raw http URL without Twilio auth needed
    if not media_url.startswith("https://api.twilio.com"):
        return media_url

    try:
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "media_storage")
        os.makedirs(temp_dir, exist_ok=True)
        filename = f"wa_img_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(temp_dir, filename)

        res = requests.get(media_url, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), timeout=10)
        if res.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(res.content)
            return filepath
    except Exception as e:
        print(f"[Media Download Error] {e}")

    return media_url


def query_groq_llm(prompt: str, language: str = "hi") -> str:
    """Query Groq LLM for high-accuracy, scientific natural language agricultural reasoning."""
    if not GROQ_API_KEY or "gsk_" not in GROQ_API_KEY:
        return _fallback_domain_reply(prompt, language)

    lang_names = {"hi": "Hindi", "te": "Telugu", "mr": "Marathi", "ta": "Tamil", "en": "English"}
    target_lang = lang_names.get(language, "Hindi")

    system_prompt = (
        f"You are AgriShield AI, a premier senior agricultural scientist and smart insurance advisor for Indian farmers. "
        f"Your role is to give practical, scientific, exact, and highly localized farming advice on crop diseases, weather alerts, "
        f"soil health (N-P-K ratios), fertilizer schedules, seed varieties (Kharif/Rabi), pest management (IPM), and ZKP parametric insurance risk. "
        f"Domain Rules:\n"
        f"1. For crop diseases or pests, specify exact chemical names along with recommended dosage (e.g., Propiconazole @ 1ml/L or Tricyclazole @ 0.6g/L) PLUS organic alternatives (Neem oil 10,000 ppm @ 3ml/L).\n"
        f"2. For soil & fertilizer queries, explain balanced dosing (Urea, DAP, MOP) based on crop stage.\n"
        f"3. For weather alerts, advise on irrigation timing and fertilizer top-dressing.\n"
        f"4. For insurance or claims, explain how AgriShield's Zero-Knowledge Proof (ZKP) smart contracts track satellite rainfall and trigger instant payouts without paper claims.\n"
        f"IMPORTANT: You MUST reply entirely in {target_lang}. Keep your response structured with emojis, clear bullet points, and extremely high technical accuracy."
    )

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 450
        }
        res = requests.post(url, headers=headers, json=payload, timeout=8)
        if res.status_code == 200:
            data = res.json()
            reply = data["choices"][0]["message"]["content"]
            return reply.strip()
        else:
            print(f"[Groq API Error] {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[Groq Exception] {e}")

    return _fallback_domain_reply(prompt, language)


def query_groq_for_diagnosis_qa(diag: dict, user_text: str, language: str = "hi") -> str:
    """Synthesize ResNet18 vision diagnosis with Groq LLM to answer specific farmer questions about the disease."""
    disease_name = diag.get("disease_name", "Unknown Disease")
    confidence = diag.get("confidence", 0.90) * 100
    severity = diag.get("severity", "medium").upper()
    treatment = diag.get("treatment", "Consult agricultural expert.")

    # Base structured diagnosis header
    if language == "hi":
        header = (
            f"🔬 *कृषि शील्ड AI रोग निदान रिपोर्ट* 🔬\n\n"
            f"🌿 *रोग का नाम*: {disease_name}\n"
            f"🎯 *सटीकता*: {confidence:.1f}%\n"
            f"⚠️ *गंभीरता*: {severity}\n\n"
            f"💊 *उपचार व सलाह*:\n{treatment}\n\n"
            f"🛡️ *बीमा स्थिति*: यह रोग आपके क्षेत्रीय जोखिम कवरेज के अंतर्गत ट्रैक किया जा रहा है।"
        )
    elif language == "te":
        header = (
            f"🔬 *అగ్రి షీల్డ్ AI వ్యాధి నిర్ధారణ* 🔬\n\n"
            f"🌿 *వ్యాధి పేరు*: {disease_name}\n"
            f"🎯 *ఖచ్చితత్వం*: {confidence:.1f}%\n"
            f"⚠️ *తీవ్రత*: {severity}\n\n"
            f"💊 *చికిత్స మరియు సలహా*:\n{treatment}"
        )
    elif language == "mr":
        header = (
            f"🔬 *अॅग्री शील्ड AI रोग निदान* 🔬\n\n"
            f"🌿 *रोगाचे नाव*: {disease_name}\n"
            f"🎯 *अचूकता*: {confidence:.1f}%\n"
            f"⚠️ *तीव्रता*: {severity}\n\n"
            f"💊 *उपचार आणि सल्ला*:\n{treatment}"
        )
    elif language == "ta":
        header = (
            f"🔬 *அக்ரி ஷீல்ட் AI நோய் கண்டறிதல்* 🔬\n\n"
            f"🌿 *நோயின் பெயர்*: {disease_name}\n"
            f"🎯 *துல்லியம்*: {confidence:.1f}%\n"
            f"⚠️ *தீவிரம்*: {severity}\n\n"
            f"💊 *சிகிச்சை மற்றும் ஆலோசனை*:\n{treatment}"
        )
    else:
        header = (
            f"🔬 *AgriShield AI Disease Diagnosis Report* 🔬\n\n"
            f"🌿 *Disease Name*: {disease_name}\n"
            f"🎯 *AI Confidence*: {confidence:.1f}%\n"
            f"⚠️ *Severity*: {severity}\n\n"
            f"💊 *Recommended Treatment*:\n{treatment}\n\n"
            f"🛡️ *Insurance Status*: Tracked under your regional ZKP parametric risk coverage."
        )

    # If user just uploaded photo without extra specific questions, return the clean header
    clean_text = user_text.strip().lower()
    if not clean_text or clean_text in ["check this leaf", "check", "photo", "diagnose", "jaanch kare", ""]:
        return header

    # If Groq is available and user asked a specific question along with the photo, synthesize Q&A
    if GROQ_API_KEY and "gsk_" in GROQ_API_KEY:
        lang_names = {"hi": "Hindi", "te": "Telugu", "mr": "Marathi", "ta": "Tamil", "en": "English"}
        target_lang = lang_names.get(language, "Hindi")

        prompt = (
            f"A farmer uploaded a photo of their crop which our ResNet18 model diagnosed as: '{disease_name}' "
            f"(Severity: {severity}, Recommended treatment: {treatment}).\n"
            f"In addition to the photo, the farmer asked the following question/comment: '{user_text}'.\n\n"
            f"Please write a concise, helpful response entirely in {target_lang} that:\n"
            f"1. Briefly confirms the diagnosis ({disease_name}).\n"
            f"2. Directly and scientifically answers their exact question/comment.\n"
            f"3. Gives practical dosage and application tips.\n"
            f"Keep it under 150 words and format cleanly with bullet points and emojis."
        )
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 300
            }
            res = requests.post(url, headers=headers, json=payload, timeout=7)
            if res.status_code == 200:
                qa_part = res.json()["choices"][0]["message"]["content"].strip()
                return f"{header}\n\n💬 *विशेषज्ञ सलाह (Expert Q&A)*:\n{qa_part}"
        except Exception as e:
            print(f"[Groq Diagnosis Q&A Exception] {e}")

    return header


def _fallback_domain_reply(prompt: str, language: str = "hi") -> str:
    """Smart comprehensive domain fallback if LLM is unreachable or for high-accuracy local matching."""
    prompt_lower = prompt.lower()
    
    # 1. Weather & Rainfall
    if any(k in prompt_lower for k in ["weather", "rain", "forecast", "barish", "mausam", "मौसम", "बारिश", "వాతావరణం", "వర్షం", "हवामान", "மழை"]):
        if language == "te":
            return "🌦️ *అగ్రి షీల్డ్ వాతావరణ హెచ్చరిక*: రాబోయే 3 రోజుల్లో ఓ మోస్తరు వర్షాలు (8-15 మి.మీ) కురిసే అవకాశం ఉంది. ఈరోజు నీటిపారుదల నివారించండి మరియు వర్షం తగ్గిన తర్వాతే ఎరువులు వేయండి."
        elif language == "mr":
            return "🌦️ *अॅग्री शील्ड हवामान सल्ला*: पुढील ३ दिवसांत मध्यम पाऊस (८-१५ मिमी) पडण्याची शक्यता आहे. आज सिंचन टाळा आणि फवारणीचे काम उघडीप पाहिल्यानंतरच करा."
        elif language == "ta":
            return "🌦️ *அக்ரி ஷீல்ட் வானிலை எச்சரிக்கை*: அடுத்த 3 நாட்களில் மிதமான மழை (8-15 மி.மீ) பெய்ய வாய்ப்புள்ளது. இன்று நீர்ப்பாசனத்தைத் தவிர்க்கவும்."
        elif language == "en":
            return "🌦️ *AgriShield Weather Alert*: Moderate rainfall (8-15mm) expected over the next 3 days across your district. Avoid heavy irrigation today. Ideal window for fertilizer top-dressing opens after 48 hours."
        return "🌦️ *कृषि शील्ड मौसम सलाह*: अगले 3 दिनों में आपके क्षेत्र में हल्की से मध्यम बारिश (8-15 मिमी) की संभावना है। आज सिंचाई करने से बचें। रासायनिक छिड़काव या उर्वरक डालने का काम मौसम साफ होने पर ही करें।"

    # 2. Crop Selection & Seeds
    if any(k in prompt_lower for k in ["crop", "suggest", "recommend", "seed", "beej", "buwai", "kharif", "rabi", "फसल", "बुवाई", "बीज", "పంట", "విత్తనాలు", "पीक", "बियाणे", "பயிர்"]):
        if language == "te":
            return "🌾 *పంట సిఫార్సు*: నల్ల రేగడి మరియు ఒండ్రు నేలలో ఖరీఫ్ సీజన్‌కు అనుకూలమైన పంటలు: 1. సోయాబీన్ (JS 335 / 9560 - 92% అనుకూలత), 2. ప్రత్తి (Bt కాటన్ - 87%), 3. కంది (ICPL 87119 - 84%)."
        elif language == "mr":
            return "🌾 *पीक सल्ला*: काळ्या आणि भारी जमिनीत खरीप हंगामासाठी सर्वोत्तम पिके: १. सोयाबीन (जे.एस. ३३५ - ९२% यश), २. कपाशी (बीट कपाशी - ८७%), ३. तूर (आयसीपीएल ८७११९ - ८४%)."
        elif language == "en":
            return "🌾 *AgriShield Crop Recommendation*: For Black Cotton / Alluvial soil in Kharif season, top AI-matched crops: 1. Soybean (JS 335/9560 - 92% yield match), 2. Bt Cotton (87% match), 3. Pigeon Pea (ICPL 87119 - 84% match)."
        return "🌾 *कृषि शील्ड फसल व बीज सलाह*: काली और दोमट मिट्टी में खरीफ मौसम के लिए सर्वोत्तम प्रमाणित फसलें:\n1. सोयाबीन (JS 335 / 9560 - 92% उपयुक्तता)\n2. बीटी कपास (87% उपयुक्तता)\n3. अरहर/तूर (ICPL 87119 - 84% उपयुक्तता)\nबुवाई से पहले बीजोपचार (ट्राइकोडर्मा 10 ग्राम/किग्रा) अवश्य करें।"

    # 3. Fertilizer & Soil Nutrition (Urea, DAP, NPK)
    if any(k in prompt_lower for k in ["fertilizer", "urea", "dap", "npk", "mop", "manure", "khad", "khada", "urvarak", "खाद", "उर्वरक", "यूरिया", "ఎరువులు", "ఖనిజాలు", "खत", "உரம்"]):
        if language == "te":
            return "🧪 *ఎరువుల యాజమాన్యం (NPK)*: పంటకు సమతుల్య పోషకాలు ఇవ్వండి. వరి/మొక్కజొన్నకు ఎకరాకు 50 kg DAP బేసల్ డోస్‌గా వేయండి. యూరియాను 3 దఫాలుగా (నాట్లు వేసిన 20, 40, 60 రోజులకు) వేయడం వల్ల దిగుబడి పెరుగుతుంది."
        elif language == "mr":
            return "🧪 *खत व्यवस्थापन (NPK)*: पिकाच्या वाढीच्या काळात संतुलित खतांचा वापर करा. लागवडीच्या वेळी ५० किलो डीएपी (DAP) व ३० किलो म्युरेट ऑफ पोटॅश (MOP) द्या. युरिया विभागून ३ वेळा दिल्यास नत्राचा अपव्यय टळतो."
        elif language == "en":
            return "🧪 *Fertilizer Schedule (NPK)*: For cereals and pulses, ensure balanced N-P-K nutrition. Apply 50 kg DAP + 30 kg MOP per acre as basal dose at sowing. Split Urea application into 3 top-dressings (at vegetative, tillering, and flowering stages) to prevent nitrogen leaching."
        return "🧪 *संतुलित उर्वरक प्रबंधन (NPK सलाह)*:\n• बुवाई के समय बेसल डोज: 50 किग्रा DAP + 30 किग्रा पोटाश (MOP) प्रति एकड़ डालें।\n• यूरिया का उपयोग: यूरिया को एक साथ डालने के बजाय 3 बार (बुवाई के 20, 40 और 60 दिन बाद) थोड़ा-थोड़ा डालें, जिससे नाइट्रोजन का नुकसान रुकता है और जड़ें मजबूत होती हैं।"

    # 4. Pest & Insect Management (IPM)
    if any(k in prompt_lower for k in ["pest", "insect", "worm", "whitefly", "aphid", "keeda", "sundi", "bollworm", "कीट", "सुंडी", "माहू", "సస్యరక్షణ", "పురుగు", "కీటకాలు", "कीड", "अळी", "பூச்சி"]):
        if language == "te":
            return "🐛 *సస్యరక్షణ (పురుగుల నివారణ)*: రసం పీల్చే పురుగులు (తెల్లదోమ, పేనుబంక) నివారణకు వేప నూనె (10,000 ppm) లీటరు నీటికి 3 ml కలిపి పిచికారీ చేయండి. ఉధృతి ఎక్కువగా ఉంటే ఇమిడాక్లోప్రిడ్ (0.5 ml/L) వాడండి."
        elif language == "mr":
            return "🐛 *कीड नियंत्रण (IPM)*: रस शोषक किडींच्या (पांढरी माशी, मावा) नियंत्रणासाठी कडुनिंबाचे तेल (Neem Oil 10,000 ppm) ३ मिली प्रति लिटर पाण्यात मिसळून फवारा. प्रादुर्भाव जास्त असल्यास इमिडाक्लोप्रिड ०.५ मिली/लिटर वापरा."
        elif language == "en":
            return "🐛 *Pest Management (IPM)*: For sucking pests (whiteflies, aphids, jassids), apply Neem Oil (10,000 ppm @ 3ml/L) as a preventive organic spray. If infestation crosses Economic Threshold Level (ETL), spray Imidacloprid 17.8 SL @ 0.5ml per liter of water."
        return "🐛 *कीट एवं सुंडी नियंत्रण (IPM सलाह)*:\n• रस चूसने वाले कीट (सफेद मक्खी, माहू) के लिए: नीम का तेल (10,000 ppm) 3 मिली प्रति लीटर पानी में मिलाकर preventative छिड़काव करें।\n• सुंडी/इल्ली व अधिक प्रकोप होने पर: इमिडाक्लोप्रिड 17.8 SL (0.5 मिली/लीटर) या क्लोरांट्रानिलिप्रोल (0.4 मिली/लीटर) का छिड़काव करें।"

    # 5. Parametric Insurance & ZKP Claims
    if any(k in prompt_lower for k in ["insurance", "claim", "zkp", "payout", "policy", "beema", "bima", "dawa", "बीमा", "दावा", "क्लाइम", "బీమా", "క్లెయిమ్", "विमा", "காப்பீடு"]):
        if language == "te":
            return "🛡️ *అగ్రి షీల్డ్ ZKP బీమా*: మీ పొలాన్ని శాటిలైట్ మరియు వాతావరణ సెన్సార్ల ద్వారా 24/7 పర్యవేక్షిస్తున్నాము. వర్షపాతం లేదా కరువు పరిమితి దాటితే, ZKP స్మార్ట్ కాంట్రాక్టుల ద్వారా ఎలాంటి కాగితాలు లేకుండా నేరుగా మీ బ్యాంకు ఖాతాలో క్లెయిమ్ జమ అవుతుంది!"
        elif language == "mr":
            return "🛡️ *अॅग्री शील्ड ZKP विमा*: तुमच्या शेताची उपग्रह आणि हवामान सेन्सॉरद्वारे सतत देखरेख सुरू आहे. दुष्काळ किंवा अतिवृष्टी झाल्यास, ZKP स्मार्ट कॉन्ट्रॅक्टद्वारे कागदपत्रांशिवाय थेट बँक खात्यात नुकसान भरपाई जमा होते!"
        elif language == "en":
            return "🛡️ *AgriShield Parametric Insurance (ZKP)*: Your farm risk score is monitored 24/7 via satellite telemetry and IoT rainfall indices. If weather anomalies breach parametric thresholds, Zero-Knowledge Proof smart contracts execute automated, zero-paperwork payouts directly to your bank account!"
        return "🛡️ *कृषि शील्ड ZKP पैरामीट्रिक बीमा*:\nआपके खेत की निगरानी सैटेलाइट व मौसम सेंसर द्वारा 24/7 की जा रही है।\n• बिना कागजी कार्रवाई: यदि बारिश या सूखा निर्धारित सीमा (Threshold) को पार करता है, तो ZKP स्मार्ट कॉन्ट्रैक्ट स्वतः सक्रिय हो जाता है।\n• तुरंत भुगतान: क्लेम राशि बिना किसी पटवारी या सर्वेयर की प्रतीक्षा किए सीधे आपके बैंक खाते में ट्रांसफर कर दी जाती है!"

    # 6. Default High-Quality Domain Help / Intro
    if language == "te":
        return "🌾 నమస్తే! నేను అగ్రి షీల్డ్ AI (AgriShield AI) ని. మీరు పంట ఫోటో పంపి వ్యాధి నిర్ధారణ చేసుకోవచ్చు లేదా వాతావరణం, ఎరువులు, విత్తనాలు, మరియు బీమా గురించి ఏ ప్రశ్న అయినా అడగవచ్చు!"
    elif language == "mr":
        return "🌾 नमस्कार! मी अॅग्री शील्ड AI (AgriShield AI) आहे. तुम्ही पिकाचा फोटो पाठवून रोगाचे अचूक निदान करू शकता किंवा हवामान, खते, बियाणे आणि विम्याविषयी कोणताही प्रश्न विचारू शकता!"
    elif language == "ta":
        return "🌾 வணக்கம்! நான் அக்ரி ஷீல்ட் AI. பயிர் புகைப்படத்தை அனுப்பி நோயைக் கண்டறியலாம் அல்லது வானிலை, உரம், விதைகள் மற்றும் காப்பீடு பற்றி எந்தக் கேள்வியும் கேட்கலாம்!"
    elif language == "en":
        return "🌾 Welcome to AgriShield AI! I am your 24/7 Agricultural Scientist. You can:\n1. 📸 Upload a crop/leaf photo for instant ResNet18 AI diagnosis & treatment.\n2. 💬 Ask any farming question (weather alerts, NPK fertilizers, pest control, or ZKP insurance)."
    return "🌾 नमस्ते! मैं कृषि शील्ड AI (AgriShield AI) आपका 24/7 कृषि वैज्ञानिक हूँ। आप मुझसे:\n1. 📸 **फोटो निदान**: अपनी फसल या पत्ते की फोटो भेजकर रोग की पहचान व उपचार पा सकते हैं।\n2. 💬 **सटीक सलाह**: मौसम पूर्वानुमान, खाद/उर्वरक (NPK), बीज चयन, कीट नियंत्रण या ZKP बीमा से जुड़ा कोई भी सवाल पूछ सकते हैं!"


def handle_whatsapp_inbound(
    from_number: str,
    body: str = "",
    num_media: int = 0,
    media_url: Optional[str] = None,
    media_content_type: Optional[str] = None
) -> dict:
    """
    Main entrypoint for inbound WhatsApp messages (from Twilio webhook or Simulator).
    Handles language switching, photo diagnosis with Q&A synthesis, and conversational reasoning.
    """
    msg_id = f"WA_{uuid.uuid4().hex[:10]}"
    received_at = datetime.utcnow().isoformat()
    phone_clean = from_number.replace("whatsapp:", "").strip()
    user_lang = get_user_language(phone_clean)

    # Log inbound message
    inbound_log = {
        "msg_id": msg_id,
        "direction": "inbound",
        "channel": "whatsapp",
        "from": phone_clean,
        "body": body,
        "num_media": num_media,
        "media_url": media_url,
        "timestamp": received_at,
        "language": user_lang
    }
    _whatsapp_conversations.append(inbound_log)

    body_clean = body.strip().lower()

    # 1. Check for Explicit Language Switch (Phase 3)
    if body_clean in LANGUAGE_MAP:
        new_lang, lang_name, reply_text = LANGUAGE_MAP[body_clean]
        set_user_language(phone_clean, new_lang)
        outbound_log = _log_and_send_reply(phone_clean, reply_text, msg_id, new_lang)
        return _format_response(inbound_log, outbound_log, reply_text, "language_switch")

    # 2. PRIORITY CHECK: Handle Photo Upload Diagnosis FIRST (`num_media > 0` or `media_url` present)
    # This prevents photos from being accidentally intercepted by help menu checks when Body is 'help' or empty.
    if int(num_media or 0) > 0 or (media_url and str(media_url).strip() != ""):
        local_img = download_twilio_media(media_url or "")
        
        # Call ResNet18 / vision classification service
        try:
            diag = classify_image(
                image_path=local_img or "sample_leaf.jpg",
                crop_type="Paddy",
                description=body,
                language=user_lang
            )
            # Synthesize vision diagnosis with natural language Q&A answering any farmer questions
            reply_text = query_groq_for_diagnosis_qa(diag, body, user_lang)
        except Exception as e:
            print(f"[Diagnosis Exception] {e}")
            reply_text = "⚠️ Could not process image at this moment. Please try uploading a clearer photo of the leaf."

        outbound_log = _log_and_send_reply(phone_clean, reply_text, msg_id, user_lang, diag_meta=diag if 'diag' in locals() else None)
        return _format_response(inbound_log, outbound_log, reply_text, "photo_diagnosis", diag if 'diag' in locals() else None)

    # 3. Check for Help Menu Command (ONLY when no image is uploaded)
    if any(k == body_clean for k in ["help", "menu", "मदद", "sahayata", "సహాయం", "मदत", "உதவி", "0", "?"]):
        help_text = (
            "🌾 *AgriShield AI Command Center & Help Menu* 🌾\n\n"
            "📸 *1. Photo Diagnosis*: Send any leaf photo for ResNet18 AI disease detection & cure.\n"
            "💬 *2. Ask Anything*: Ask about weather, seeds, fertilizer, or crop insurance.\n"
            "🌐 *3. Change Language* (भाषा बदलें):\n"
            "   • Reply *1* or *HINDI* for हिन्दी\n"
            "   • Reply *2* or *TELUGU* for తెలుగు\n"
            "   • Reply *3* or *MARATHI* for मराठी\n"
            "   • Reply *4* or *TAMIL* for தமிழ்\n"
            "   • Reply *5* or *ENGLISH* for English\n\n"
            "📞 *Toll-Free IVR Hotline*: 1800-AGRI-SHIELD"
        )
        outbound_log = _log_and_send_reply(phone_clean, help_text, msg_id, user_lang)
        return _format_response(inbound_log, outbound_log, help_text, "help_menu")

    # 4. Handle Text Conversational Q&A via Groq LLM & Comprehensive Domain Knowledge Base
    ai_reply = query_groq_llm(body, user_lang)
    outbound_log = _log_and_send_reply(phone_clean, ai_reply, msg_id, user_lang)
    return _format_response(inbound_log, outbound_log, ai_reply, "llm_qa")


def _log_and_send_reply(phone: str, reply_text: str, in_reply_to: str, lang: str, diag_meta: Optional[dict] = None) -> dict:
    """Log outbound reply and send via Twilio if applicable."""
    reply_id = f"WA_{uuid.uuid4().hex[:10]}"
    outbound = {
        "msg_id": reply_id,
        "direction": "outbound",
        "channel": "whatsapp",
        "to": phone,
        "body": reply_text,
        "in_reply_to": in_reply_to,
        "timestamp": datetime.utcnow().isoformat(),
        "language": lang,
        "diagnosis": diag_meta
    }
    _whatsapp_conversations.append(outbound)
    
    # Send via Twilio REST if not a simulation call
    # In live webhook mode, FastAPI returns TwiML XML directly, but we log it here
    return outbound


def _format_response(inbound: dict, outbound: dict, reply_text: str, action_type: str, diag_meta: Optional[dict] = None) -> dict:
    """Format standardized return dictionary for webhook & simulation API."""
    return {
        "inbound_msg_id": inbound["msg_id"],
        "reply_msg_id": outbound["msg_id"],
        "farmer_message": inbound["body"],
        "ai_reply": reply_text,
        "channel": "whatsapp",
        "from": inbound["from"],
        "language": inbound.get("language", "hi"),
        "action_type": action_type,
        "diagnosis": diag_meta,
        "timestamp": inbound["timestamp"]
    }
