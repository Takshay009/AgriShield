# 🌱 FarmerPulse

**FarmerPulse** is an AI-powered agricultural protection platform designed to empower farmers with early crop disease diagnosis, climate and water risk advisories, smart crop recommendations, multilingual voice/SMS/WhatsApp AI assistance, and privacy-preserving parametric risk verification with Web3 insurance.

---

## ✨ Features

- 🔬 **AI Crop Disease Diagnosis**: Upload crop photos to get instant AI-based disease detection (powered by PyTorch & Groq Vision AI) with multilingual treatment recommendations (English, Hindi, Telugu, Tamil, Marathi).
- 🌦️ **Climate & Water Risk Advisory Engine**: Automated weather monitoring (OpenWeatherMap & Sentinel Hub API), dry-spell calculation, and timely alerts to protect crops from drought or heat stress.
- 🌾 **Smart Crop Recommendation**: Data-driven crop suggestions based on GPS location, soil type, soil pH, season, and groundwater depth.
- 💬 **Multilingual WhatsApp & IVR Assistance**: 
  - **WhatsApp Bot**: Interactive Q&A powered by Groq LLM (`llama-3.3-70b-versatile`) and photo diagnosis via Twilio.
  - **IVR Voice & SMS**: Multilingual voice and text alerts powered by Twilio and Bhashini / Speech-to-Text / Text-to-Speech engines.
- 🔐 **Zero-Knowledge Proof (ZKP) Water Risk Verification**: Uses Circom ZK circuits to prove farm water stress compliance without exposing sensitive raw farm data.
- ⛓️ **Decentralized Parametric Insurance & NFTs**: Web3 smart contract integration (Polygon / RSK) for automated claims payout and NFT proof-of-insurance minting.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) |
| **Database** | SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM |
| **AI / Machine Learning** | PyTorch, Groq LLM (`llama-3.3-70b-versatile`, `llama-3.2-90b-vision`), Faster-Whisper, gTTS |
| **Integrations** | Twilio (SMS / IVR / WhatsApp), Bhashini, OpenWeatherMap, Sentinel Hub API |
| **Blockchain & ZKP** | Web3.py, Polygon / RSK, Circom ZK Circuits |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Leaflet Maps (`react-leaflet`), Chart.js |

---

## 📁 Repository Structure

```text
FarmerPulse/
├── backend/                  # FastAPI Application
│   ├── circuits/             # Circom ZK Proof circuits for water risk
│   ├── data/                 # NFT static metadata & crop dataset references
│   ├── routers/              # API router modules (e.g. water_risk.py)
│   ├── advisory_engine.py    # Risk assessment & dry spell calculation
│   ├── auth.py               # Authentication & JWT helper functions
│   ├── crop_recommendation_service.py # Soil & climate crop recommendation
│   ├── diagnosis_service.py  # Plant disease detection logic & treatment lookup
│   ├── database.py           # Database engine & session setup
│   ├── ivr_service.py        # Twilio IVR voice service
│   ├── main.py               # Main FastAPI server entry point
│   ├── models.py             # SQLAlchemy database models
│   ├── nft_service.py        # NFT minting for parametric insurance
│   ├── requirements.txt      # Python dependencies
│   ├── sms_service.py        # SMS alert dispatcher
│   ├── weather_service.py    # Weather forecast fetcher
│   └── whatsapp_ai_service.py # WhatsApp AI bot with Groq LLM & vision
├── frontend/                 # Next.js Frontend Application
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (farms, claims, admin, login)
│   │   ├── components/       # UI Components & Farm Map
│   │   └── lib/              # API wrapper functions
│   ├── package.json          # Node.js dependencies & scripts
│   └── next.config.ts        # Next.js configuration
├── railway.json              # Deployment setup for Railway cloud platform
├── test_groq_vision.py       # Test script for Groq vision API
└── README.md                 # Project Documentation
```

---

## 🚀 Getting Started

Follow these steps to set up and run FarmerPulse locally on your system.

### Prerequisites

- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.x or higher
- **npm**: Included with Node.js

---

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd FarmerPulse
```

---

### Step 2: Backend Setup & Execution

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your API keys (optional mock modes available):*
   ```env
   # API Keys
   GROQ_API_KEY=your_groq_api_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Mock Settings for local testing (set to true if keys are not available)
   USE_MOCK_CLASSIFIER=true
   USE_MOCK_STT_TTS=true
   USE_MOCK_ZKP=false
   USE_MOCK_CHAIN=true
   
   JWT_SECRET=YOUR_DEVELOPMENT_SECRET_KEY
   ```

5. **Run the FastAPI Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   - Server running at: `http://localhost:8000`
   - Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

---

### Step 3: Frontend Setup & Execution

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Dashboard**:
   Open your browser and visit: `http://localhost:3000`

---

## 🧪 Testing

To test the Groq Vision integration script:
```bash
python test_groq_vision.py
```

To test API routes via test script:
```bash
python test.py
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.
