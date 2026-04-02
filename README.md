# 🧬 MedGenie: Digital Twin Healthcare System

> A privacy-first, AI-powered decentralized healthcare platform that creates continuously evolving digital twins of patients.

![Architecture](docs/architecture-banner.png)

## 🌟 Features

- **AI Digital Twin Engine** — GNN + Temporal Transformer for predictive health modeling
- **Real-time Health Monitoring** — Google Fit / Health Connect integration
- **Decentralized Data Ownership** — Polygon, IPFS, Ceramic DID
- **P2P Doctor Consultation** — WebRTC via LiveKit
- **Voice AI Assistant** — Whisper + Coqui TTS, multilingual
- **Offline-First Design** — SSTV, LoRa, Mesh networking
- **Smart Alerts** — Anomaly detection with SMS, calls, push notifications

## 🏗️ Architecture

| Service | Stack | Port |
|---------|-------|------|
| Frontend | Next.js 14, Three.js, Tailwind | 3000 |
| Backend API | Django 5.x + DRF | 8000 |
| AI Engine | PyTorch, GNN, HuggingFace, Ray | 8100 |
| Voice Service | Whisper, Coqui TTS | 8200 |
| Blockchain | Hardhat, Polygon, IPFS | 8300 |
| Alert Service | Node.js, Twilio | 8400 |
| Offline Service | SSTV, Mesh, LoRa | 8500 |
| WebRTC | LiveKit | 7880 |

## 🚀 Quick Start

```bash
# 1. Clone
git clone <repo-url> && cd AMTZ_DigitalTwin

# 2. Copy environment
cp .env.example .env

# 3. Start with Docker
docker-compose up -d

# OR start individually:

# Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev

# AI Engine
cd ai_engine
pip install -r requirements.txt
python server.py
```

## 📋 Phase Roadmap

- **Phase 1** ✅ Google Fit, Dashboard, Alerts
- **Phase 2** 🔄 AI Digital Twin, WebRTC, Voice AI
- **Phase 3** 📋 Federated Learning, Blockchain, Offline

## 📄 License

MIT License — Built for AMTZ Digital Twin Initiative
