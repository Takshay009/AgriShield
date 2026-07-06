# AgriShield — Phase 2 Task List
### Voice & SMS Agricultural Intelligence Layer

Tech stack baseline (matches your existing repo): **Python 3.11 + FastAPI** (backend), **SQLite + SQLAlchemy** (DB/ORM), **Next.js (TypeScript/React) + Tailwind CSS** (frontend), **Pydantic** (request/response schemas). Each task below states the exact language/framework/library to use.

---

## PHASE 2A — Smart Crop Recommendation Engine

- [ ] **Create crop reference dataset**
  Format: JSON file `backend/data/crop_reference_table.json`
  Fields per crop: `soil_type`, `water_need_mm`, `ph_min`, `ph_max`, `sowing_start`, `sowing_end`
  Tool: hand-authored JSON, validated with **Python + `json` module** in a quick test script

- [ ] **Create soil & rainfall lookup tables**
  Format: CSV files `backend/data/soil_lookup.csv`, `backend/data/rainfall_avg.csv`
  Load/query with: **pandas** (`pip install pandas`)

- [ ] **Build scoring engine**
  File: `backend/services/crop_recommendation_service.py`
  Language: **Python**
  Logic: plain functions using **pandas** for lookups + basic weighted-sum scoring (no ML library needed for v1)

- [ ] **Define Pydantic schemas**
  File: `backend/schemas/crop_recommendation.py`
  Framework: **Pydantic** (`CropRecommendationRequest`, `CropRecommendationResponse`)

- [ ] **Add FastAPI route**
  File: `backend/routers/crop_recommendation.py`
  Framework: **FastAPI** `APIRouter`
  Endpoint: `POST /api/recommend-crop`
  Register router in your existing `main.py` with `app.include_router(...)`

- [ ] **Add SQLAlchemy model (optional caching of results)**
  File: `backend/models/crop_recommendation.py`
  Framework: **SQLAlchemy ORM**, table `crop_recommendation_log`

- [ ] **Frontend: Recommended Crops card**
  Location: `frontend/app/dashboard/recommended-crops/page.tsx`
  Framework: **Next.js (App Router) + React + TypeScript**
  Styling: **Tailwind CSS**
  Data fetch: `fetch()` to your FastAPI endpoint, or **Axios** if already used elsewhere in the repo

- [ ] **(Optional, later) Swap in ML model**
  Library: **scikit-learn** (`GradientBoostingClassifier` or `RandomForestClassifier`)
  Only after rule-based version is stable and you have real yield data to train on

---

## PHASE 2B — Advisory & Dry-Spell Alert Engine

- [ ] **Extend weather mock to forecast mode**
  File: `backend/services/weather_service.py` (extend existing mock, or create if not present)
  Language: **Python**, same random/mock pattern you used for NDVI

- [ ] **Build rule engine for alerts**
  File: `backend/services/advisory_engine.py`
  Language: **Python** — plain conditional rules (no ML needed)

- [ ] **Add SQLAlchemy models**
  File: `backend/models/advisory_alert.py`, `backend/models/sensor_reading.py`
  Framework: **SQLAlchemy ORM**

- [ ] **Add scheduled job for daily dry-spell checks**
  File: `backend/jobs/dry_spell_scheduler.py`
  Library: **APScheduler** (`pip install apscheduler`), run as a background task inside FastAPI's startup event, or a separate cron-triggered script if you prefer not to keep a long-running scheduler in-process

- [ ] **Add FastAPI routes**
  File: `backend/routers/advisory.py`
  Framework: **FastAPI**
  Endpoints: `GET /api/advisory/{farm_id}`, `POST /api/sensor-data`

- [ ] **Frontend: Advisory/Alerts feed**
  Location: `frontend/app/dashboard/advisory/page.tsx`
  Framework: **Next.js + React + TypeScript + Tailwind CSS**

- [ ] **(Optional) Real IoT sensor ingestion**
  Hardware: **ESP32 + capacitive soil moisture sensor**
  Firmware: **Arduino C++** (ESP32 board package), sends HTTP POST to `/api/sensor-data`
  Alternative uplink: **LoRa** if range is a concern (needs a LoRa gateway)

---

## PHASE 2C — Conversation Gateway (Voice + SMS, Indic Languages)

- [ ] **Set up SMS/Voice provider account**
  Provider: **Twilio** (fastest to set up for a demo; Python SDK: `pip install twilio`)
  Alternative: **Exotel** or **Gupshup** if you need India-native carrier support (REST API, no official Python SDK — use `requests`)

- [ ] **Build SMS service**
  File: `backend/services/gateway/sms_service.py`
  Library: **Twilio Python SDK** (`twilio.rest.Client`)
  Inbound webhook: **FastAPI** route that parses Twilio's form-encoded webhook payload

- [ ] **Build IVR call flow**
  File: `backend/services/gateway/ivr_service.py`
  Library: **Twilio Voice API**, response format: **TwiML (XML)** generated via `twilio.twiml.voice_response.VoiceResponse`

- [ ] **Add webhook routes**
  File: `backend/routers/gateway_webhooks.py`
  Framework: **FastAPI**
  Endpoints: `POST /webhooks/sms-inbound`, `POST /webhooks/voice-inbound`
  Note: these need a public URL — use **ngrok** for local dev testing

- [ ] **Integrate Speech-to-Text**
  Primary: **Bhashini API** (Government of India ASR/TTS, REST API — call via `requests`)
  Fallback: **OpenAI Whisper** — run locally with **`faster-whisper`** (`pip install faster-whisper`) for Hindi/Telugu/Marathi support without needing internet

- [ ] **Integrate Text-to-Speech**
  Primary: **Bhashini TTS API**
  Fallback: **gTTS** (`pip install gTTS`) — simple, works offline-to-online, decent Indic language support

- [ ] **Build language session router**
  File: `backend/services/gateway/language_router.py`
  Language: **Python**, store session state (which language selected) in your existing **SQLite** DB via a new `farmer_language_pref` table (**SQLAlchemy**)

- [ ] **Create i18n message files**
  Format: JSON, files `backend/i18n/hi.json`, `backend/i18n/te.json`, `backend/i18n/mr.json`
  Structure: flat key-value (`"advisory.dry_spell": "..."`)

---

## PHASE 2D — Crop Health Logging (Photo/Voice) + AI Diagnosis + RSK Escalation

- [ ] **Set up image classification model**
  Library: **PyTorch + torchvision** (`pip install torch torchvision`)
  Model: pretrained **ResNet18/MobileNetV2** fine-tuned on the **PlantVillage dataset** (widely available on Kaggle/GitHub, open-source)
  Inference wrapper: `backend/services/diagnosis_service.py` (Python)

- [ ] **Set up voice symptom pipeline**
  STT: reuse **Bhashini/faster-whisper** from Phase 2C
  Symptom extraction: simple **keyword/intent matcher** in Python (regex or a small `scikit-learn` text classifier — no need for a full NLP framework at this stage)

- [ ] **Add SQLAlchemy models**
  File: `backend/models/health_report.py`, `backend/models/rsk_ticket.py`
  Framework: **SQLAlchemy ORM**

- [ ] **Add media upload handling**
  File: `backend/routers/health_report.py`
  Framework: **FastAPI** `UploadFile` for multipart photo/audio upload
  Storage: local filesystem `backend/media_storage/uploads/` for now (swap for **S3** or **IPFS** later, consistent with your existing "mocked storage" pattern)

- [ ] **Add diagnosis + escalation logic**
  File: `backend/services/rsk_escalation_service.py`
  Language: **Python** — if classifier confidence < threshold (e.g. 0.7), create a row in `rsk_ticket` table

- [ ] **Add RSK routes**
  File: `backend/routers/rsk.py`
  Framework: **FastAPI**
  Endpoints: `GET /api/rsk/queue`, `POST /api/rsk/respond`

- [ ] **Frontend: RSK Queue tab (admin panel extension)**
  Location: `frontend/app/admin/rsk-queue/page.tsx`
  Framework: **Next.js + React + TypeScript + Tailwind CSS**
  Add audio playback with native `<audio>` element, image display with `next/image`

- [ ] **Frontend: Report Crop Issue flow (farmer-facing)**
  Location: `frontend/app/dashboard/report-issue/page.tsx`
  Framework: **Next.js + React + TypeScript**
  Photo upload: standard `<input type="file">`
  Voice recording: **MediaRecorder Web API** (browser-native, no extra library needed)

---

## PHASE 2E — Integration & Polish

- [ ] **Feed health diagnosis severity into existing risk engine**
  File: modify your existing risk-scoring service (wherever NDVI/weather → risk score logic lives)
  Language: **Python** — add a weighted term for `diagnosis_confidence` / `severity` when a resolved/escalated health report exists for the farm

- [ ] **End-to-end demo script**
  No new code — a documented walkthrough (`DEMO.md`) covering: crop recommendation → dry-spell alert → voice-reported health issue → AI diagnosis or RSK escalation → risk score update → claim eligibility → ZK proof generation

- [ ] **Update README**
  Add Phase 2 section listing new endpoints, new env vars (Twilio SID/auth token, Bhashini API key), and what's mocked vs. real — same transparent style as your existing Phase 1 README

---

## Environment Variables to Add (`.env`)

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
BHASHINI_API_KEY=
BHASHINI_USER_ID=
USE_MOCK_STT_TTS=true   # toggle Whisper/gTTS fallback vs real Bhashini calls
```

## New Python Dependencies (`requirements.txt` additions)

```
pandas
apscheduler
twilio
requests
faster-whisper
gTTS
torch
torchvision
```
