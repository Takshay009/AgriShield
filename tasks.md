# AgriShield / CropGuard — Final Product Implementation Tasks 🌾🚀

This document outlines the final engineering and UI polish tasks required to make AgriShield a state-of-the-art, hackathon-winning agricultural intelligence and ZKP insurance platform.

---

## 🎯 Phase 3A: Smart Crop Recommendation & Groundwater UI Polish
- [x] **Backend: Groundwater Depth Parameter**
  - Add `groundwater_depth_m` (default 10.0m) to `CropRecommendationRequest` in `crop_recommendation_schemas.py`.
  - Update `crop_recommendation_service.py` to filter out deep-root/water-heavy crops (e.g., Sugarcane, Paddy) when `groundwater_depth_m > 15m`.
- [x] **Frontend: Satellite Sync & Groundwater UI (`/dashboard/recommended-crops`)**
  - Add interactive slider/input for **Groundwater Depth (meters)**.
  - Add **"Sync ISRO Bhuvan / NASA POWER Satellite"** button with loading micro-animation to simulate fetching live NDVI and groundwater depth.
  - Upgrade recommendation cards to Apple-inspired glassmorphism with yield potential bars and water requirement badges.

---

## ⚠️ Phase 3B: Automated SMS/Voice Push & Fertilization Schedules
- [x] **Backend: Automated Outbound SMS/Call Broadcast**
  - Update `dry_spell_scheduler.py` to call `sms_service.send_sms()` / `trigger_outbound_call()` when consecutive dry days (<2mm) + heat (>35°C) are detected.
- [x] **Backend: Fertilization Guidance Rules**
  - Update `advisory_engine.py` to generate rule-based **Fertilization Schedules** (e.g., NPK top-dressing reminders like *"Day 25 post-sowing -> Apply Urea/Nitrogen"* based on soil moisture).
- [x] **Frontend: Advisory UI Upgrade (`/dashboard/advisory`)**
  - Separate cards into **Irrigation & Dry-Spell Alerts** and **Fertilization Guidance**.
  - Add **"Broadcast Test SMS/Voice Alert"** button for judges to test real-time Twilio notifications from UI.

---

## 🎙️ Phase 3C: Indic Speech-to-Text (STT) & RSK Closed-Loop Notification
- [x] **Frontend: Voice-to-Text Logging (`/dashboard/report-issue`)**
  - Add **"🎙️ Record Indic Voice Note (Hindi/Telugu/Tamil)"** button.
  - Simulate Bhashini AI Speech-to-Text conversion (converting spoken Indic dialect into English/Hindi diagnostic notes like *"पत्ते पीले पड़ रहे हैं और भूरे धब्बे हैं -> Leaves turning yellow with brown lesions"*).
- [x] **Backend: RSK Closed-Loop Notification (`rsk_escalation_service.py`)**
  - When an RSK Expert resolves/reviews a ticket in `/admin/rsk-queue`, automatically dispatch an SMS to the farmer:
    *"🌾 AgriShield RSK Update: Expert Dr. Sharma reviewed your crop issue #{id}. Advice: {resolution_notes}. Apply recommended fungicide."*
- [x] **Frontend: RSK Expert Queue Polish (`/admin/rsk-queue`)**
  - Upgrade ticket cards with urgent pulse animations, AI confidence gauges, and clean diagnosis response forms.

---

## 💬 Phase 3D: WhatsApp Business Hook & Indic TTS Polish
- [x] **Backend: WhatsApp Inbound Webhook**
  - Add `/webhooks/whatsapp-inbound` route in `sms_service.py` to simulate farmers sending crop photos and receiving AI diagnosis replies via WhatsApp Business chat.
- [x] **Frontend: WhatsApp & IVR Hub (`/dashboard/whatsapp-ivr`)**
  - Add a dedicated **"Indic Voice IVR & WhatsApp Assistant"** card on the main dashboard showing live demo phone numbers, QR codes, and SMS commands for judges.

---

## 🖥️ Phase 3E: Server Restart & Full UI Verification
- [x] **Infrastructure: Restart Background Servers**
  - Launch FastAPI backend (`uvicorn main:app --port 8000`) and Next.js frontend (`npm run dev`).
- [x] **Verification: Autonomous Browser Audit**
  - Run browser subagent across all upgraded pages (`/dashboard`, `/dashboard/recommended-crops`, `/dashboard/advisory`, `/dashboard/report-issue`, `/admin/rsk-queue`) to capture screenshots and verify zero build/runtime errors.
