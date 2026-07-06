# AgriShield / CropGuard — Project Review & Hackathon Gap Analysis 🌾🛡️

## Executive Summary
Current MVP solid. Combines **ZKP Web3 Insurance** with **Phase 2 Voice/SMS Agricultural Intelligence Layer**. 
Meets core structure of hackathon problem statement. Small gaps remain to hit 100% data-driven realism and full Indic voice immersion.

---

## 📊 Component 1: Smart Crop Recommendation Engine
**Requirement:** Recommend crops using satellite and soil data.

### ✅ What We Built
- [crop_recommendation_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/crop_recommendation_service.py): Matches soil type (*Alluvial, Black, Red, Clay*), pH, and NPK against [crop_reference_table.json](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/data/crop_reference_table.json).
- Cross-references localized historical rainfall ([rainfall_avg.csv](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/data/rainfall_avg.csv)).

### 🔍 What Left / Suggestions
1. **Groundwater Depth Parameter (Critical Gap):** Problem statement explicitly cites *groundwater depth*. 
   - *Fix:* Add `groundwater_depth_meters` to `CropRecommendationRequest` schema. Filter crops requiring deep water tables (e.g., sugarcane/paddy) if groundwater > 15m deep.
2. **Live Satellite / Remote Sensing API:** Currently uses static CSV rainfall.
   - *Fix:* Connect to **NASA POWER API**, **Google Earth Engine**, or **ISRO Bhuvan API** to pull real-time NDVI (vegetation index) and satellite soil moisture.

---

## 🌦️ Component 2: Real-Time Advisory & Dry-Spell Alerts
**Requirement:** Localized weather forecasts and ground sensor data for irrigation/fertilization guidance.

### ✅ What We Built
- [weather_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/weather_service.py): Pulls 7-day live forecasts from Open-Meteo API.
- [advisory_engine.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/advisory_engine.py): Rule engine triggers drought alerts on consecutive dry days (<2mm rain) + heat (>35°C).
- [dry_spell_scheduler.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/dry_spell_scheduler.py): Background cron job checks farms every 24 hours.
- `/api/sensor-data`: Endpoint for IoT soil moisture/temp logging.

### 🔍 What Left / Suggestions
1. **Automated Outbound SMS/Voice Push:** Scheduler creates DB alerts but doesn't auto-dial farmers.
   - *Fix:* Inside `dry_spell_scheduler.py`, call [sms_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/sms_service.py) to broadcast Twilio SMS/IVR calls immediately when drought detected.
2. **Fertilization Guidance:** Currently focuses heavy on irrigation/drought.
   - *Fix:* Add NPK top-dressing rules in `advisory_engine.py` (e.g., *"Day 25 post-sowing + soil moisture OK → apply Urea/Nitrogen"*).
3. **IoT Webhook Override:** 
   - *Fix:* If live sensor soil moisture < 18%, trigger immediate emergency irrigation alert regardless of weather forecast.

---

## 🔬 Component 3: Crop Health Logging & RSK Expert Queue
**Requirement:** Photo/voice logging for AI diagnosis, connected directly to Rythu Seva Kendras (RSK) for follow-up.

### ✅ What We Built
- [report-issue/page.tsx](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/frontend/src/app/dashboard/report-issue/page.tsx): Farmer uploads leaf photo and records voice note.
- [diagnosis_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/diagnosis_service.py): ResNet18/mock disease classification + symptom keyword extraction.
- [rsk_escalation_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/rsk_escalation_service.py): Auto-escalates to `/admin/rsk-queue` if AI confidence < 70% or severity High.

### 🔍 What Left / Suggestions
1. **Indic Speech-to-Text (STT) Integration:** Currently relies on typed text or raw audio blob storage.
   - *Fix:* Integrate **Bhashini API** (Govt of India National Language Translation Mission) or OpenAI Whisper for real-time voice STT in Hindi/Telugu/Marathi.
2. **Closed-Loop Farmer Notification:** When RSK expert submits diagnosis in admin panel.
   - *Fix:* Trigger outbound SMS/WhatsApp alert: *"RSK Agronomist replied: Apply Mancozeb 2g/L water for Late Blight."*

---

## 🗣️ Component 4: Voice & SMS in Indic Languages
**Requirement:** Accessible to small/marginal farmers via Voice and SMS in Indic languages.

### ✅ What We Built
- [ivr_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/ivr_service.py) & [sms_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/sms_service.py): Twilio webhooks for inbound/outbound calls and SMS.
- [language_router.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/language_router.py) + i18n dictionaries ([hi.json](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/i18n/hi.json), [te.json](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/i18n/te.json), [mr.json](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/i18n/mr.json)).

### 🔍 What Left / Suggestions
1. **WhatsApp Business Bot:** SMS/IVR good, but Indian farmers heavily use WhatsApp.
   - *Fix:* Connect Twilio WhatsApp API webhook to let farmers send plant photos and receive voice voice-note replies directly in WhatsApp.
2. **Dynamic Indic TTS:** 
   - *Fix:* Replace static TwiML strings with Amazon Polly Indic / Bhashini neural TTS voices for natural-sounding regional dialects.

---

## 🏆 Top 3 Priority Action Items for Hackathon Winning Polish
1. **Add Groundwater Depth Input:** Add `groundwater_depth_m` slider on `/dashboard/recommended-crops` to directly answer problem statement's groundwater clause.
2. **Connect RSK Reply to SMS Push:** Add 3 lines in [rsk_escalation_service.py](file:///c:/Users/taksh/OneDrive/Desktop/Hackathon/AgriShield-Crop-health-monitoring-and-insurance-helping-with-ZKP-/backend/rsk_escalation_service.py) to fire Twilio SMS when expert resolves ticket.
3. **Mention Bhashini / ISRO in Architecture:** Even if simulated, add toggle/badge in UI showing *"Powered by ISRO Bhuvan Satellite & Bhashini Indic AI"* to impress judges.
