# AgriShield MVP — Complete Demo Guide 🌾🛡️

Welcome to the **AgriShield / CropGuard MVP** demo! This platform combines **Zero-Knowledge Proofs (ZKP)** for privacy-preserving agricultural insurance with an **AI-powered Crop Health & Advisory Platform**.

---

## 🌟 Key Features & Phase 2 Implementations

### 1. 🌾 Smart Crop Recommendation Engine (Phase 2A)
- **What it does**: Analyzes soil type, nitrogen/phosphorus/potassium (NPK) ratios, pH, rainfall, and temperature to recommend optimal crops.
- **Where to test**: Go to `/dashboard/recommended-crops`.
- **How it works**: Uses a scoring rule engine matching farm conditions against `crop_reference_table.json`.

### 2. ⚠️ Advisory & Dry-Spell Alert Engine (Phase 2B)
- **What it does**: Monitors weather forecasts (via Open-Meteo API) and IoT soil sensor data to predict dry spells, heatwaves, and flood risks.
- **Where to test**: Go to `/dashboard/advisory`.
- **How it works**: Combines real-time forecast data with rule-based agronomic thresholds to issue actionable farming advisories.

### 3. 📞 Conversation Gateway — Voice & SMS (Phase 2C)
- **What it does**: Allows offline or low-literacy farmers to interact via IVR (Interactive Voice Response) and SMS in local languages (Hindi, Telugu, Marathi).
- **Where to test**: Backend Webhook endpoints (`/webhooks/sms-inbound`, `/webhooks/voice-inbound`, `/webhooks/voice-menu`).
- **How it works**: Simulates Twilio call/SMS flows and uses i18n localization dictionaries for automated voice menus.

### 4. 🔬 Crop Health + AI Diagnosis & RSK Queue (Phase 2D & 2E)
- **What it does**: Farmers can upload crop photos and voice/text symptom notes. An AI model diagnoses crop diseases (e.g., Late Blight, Leaf Rust) and suggests immediate treatments. If confidence is low (<70%) or severity is high, the issue is escalated to the **Remote Support Kisan (RSK) Expert Queue**.
- **Where to test**:
  - **Farmer View**: `/dashboard/report-issue` (Submit photos & symptom descriptions).
  - **Admin / Expert View**: `/admin/rsk-queue` (Review open tickets, priority badges, and respond with expert advice).
- **Integration into Insurance**: Disease severity directly feeds into the **ZKP Risk Engine** — high disease severity increases the farm risk score, triggering insurance claim eligibility.

---

## 🚀 How to Run Locally

### 1. Start Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)*

### 2. Start Frontend (Next.js + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at: `http://localhost:3000`*

---

## 🎬 Step-by-Step Demo Walkthrough

1. **Farmer Dashboard**: Open `http://localhost:3000/dashboard` after logging in. Notice the premium Apple-inspired card design.
2. **Crop Recommendations**: Click on **Crop Recommendations**. Select a soil type (e.g., Alluvial) and view AI-scored crop matches with yield estimations and water requirements.
3. **Weather Advisory**: Navigate to **Advisory & Alerts**. Check the 7-day weather forecast, soil moisture status, and automated dry-spell warnings.
4. **Report Crop Disease**: Go to **Report Crop Issue**. Select your farm, describe symptoms (or enter keywords like "yellowing leaves", "brown spots"), and submit. See instantaneous AI diagnosis and treatment recommendations.
5. **RSK Expert Queue**: Switch to the Admin portal at `http://localhost:3000/admin/rsk-queue`. View urgent escalated tickets, inspect farmer symptoms, and submit an expert response.
6. **ZKP Claim Verification**: In the main claims dashboard (`/claims`), generate a cryptographic Zero-Knowledge Proof (Groth16) proving farm risk eligibility without revealing raw farm data on-chain.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python FastAPI, SQLAlchemy, SQLite, Pydantic, Python-Multipart.
- **AI / ML**: ResNet-18 plant disease classifier (with deterministic mock fallback), Rule-based Agronomy Engine.
- **Web3 / Cryptography**: Circom & SnarkJS (Groth16 ZK-SNARKs), Dynamic SVG NFTs.
- **External Integrations**: Open-Meteo Weather API, Twilio SMS/IVR Webhook simulation.
