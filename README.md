# 🛡️ Aegis AI

### AI-Powered Parametric Insurance for India's Gig Workers

> **Guidewire Hackathon 2026** · Demo Prototype

---

## 📖 Overview
India has over 50 million gig workers (delivery riders, auto drivers, daily-wage earners) who lose income every time it rains heavily or a smog chokes the city. Traditional insurance is broken for these workers—it requires extensive documentation, lengthy claim processes, and weeks of waiting.

**Aegis AI** is a **parametric insurance platform** that automatically pays out gig workers based on real-world data triggers (such as severe rainfall or high AQI), completely removing the need for manual claims or paperwork.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Risk Engine** | Advanced ML models (FastAPI + Scikit-Learn) estimating risk likelihood and confidence using dynamic weather/AQI features. |
| ⚡ **Parametric Triggers** | Auto-payout straight to gig-workers when rainfall > 50mm OR AQI > 300. |
| 💸 **Dynamic Payouts** | Loss prediction percentage applied automatically against daily average earnings. |
| 🔍 **Fraud Detection** | AI-driven anomaly detection to instantly flag suspicious claims and excessive payout frequencies. |
| 🏙️ **Multi-City Support** | Automated cron polling for multiple cities' weather patterns keeping the Ledger updated. |

---

## 📁 System Architecture

The project has evolved into a robust three-tier microservice architecture:

```text
aegis-ai/
├── frontend/             ← React + Vite + Tailwind UI (Dashboard)
├── backend/              ← Node.js + Express + MySQL (Core API & Cron Jobs)
├── ai_service/           ← Python + FastAPI (ML Models API for Risk & Anomalies)
└── render.yaml           ← Infrastructure as Code for Render Deployment
```

---

## 🚀 How To Run Locally

### 1. Start the DB & Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Copy the `.env.example` to `.env` and fill in DB details, external API keys, etc.
3. Import the database schema & seed data (e.g., using MySQL Workbench) from `backend/sql/schema.sql` and `backend/sql/seed.sql`.
4. Run the API:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:3000` (or whatever your PORT is set to).*

### 2. Start the AI Service

1. Navigate to the `ai_service` directory:
   ```bash
   cd ai_service
   ```
2. Setup and install dependencies:
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the ML server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *The AI API will be accessible at `http://localhost:8000`.*

### 3. Start the Frontend Dashboard

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Create/update a `.env` file pointing to your backend:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   *Access the web app via `http://localhost:5173`.*

---

## ☁️ Deployment

This repository is pre-configured for **Render** via the provided `render.yaml`.
You can seamlessly deploy all three services connected and configured with a single click.

1. Go to [Render Dashboard](https://dashboard.render.com/) and create a "Blueprint Instance".
2. Connect this repository.
3. Render will provision:
   - A static site for the **Frontend**.
   - A Web Service for the **Node.js Backend**.
   - A Web Service for the **Python API**.
   - *Ensure you manually provide the MySQL database URL and secret variables directly in the Render dashboard.*

---

## 🏆 Built For
**Guidewire Hackathon 2026** | Team Aegis | India's Gig Economy Protection

*Disclaimer: This is a demo prototype built for a Hackathon and not a regulated insurance product.*
