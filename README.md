# MedStock AI

MedStock AI is a full-stack inventory intelligence and supply planning application for healthcare facilities. It combines an AI-assisted FastAPI backend with a Vite + React + TypeScript frontend for medicine inventory management, forecasting, anomaly detection, stockout alerts, supplier recommendations, and reporting.

## Project Structure

- `backend/` — FastAPI application, SQLAlchemy models, AI services, seeded database utilities, and API routers.
- `frontend/` — Vite React TypeScript single-page application.
- `data/` — Dataset and application data assets.
- `tests/` — Python backend tests.

## Tech Stack

### Backend
- Python 3
- FastAPI
- SQLAlchemy
- Pydantic
- scikit-learn, pandas, numpy, statsmodels
- ReportLab

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts

## Local Setup

### 1. Backend

From the repository root:

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will become available at `http://127.0.0.1:8000`.

### 2. Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server is configured by the Vite scripts.

## Main Features

- Medicine and inventory management
- Batch and supplier workflows
- Expiry, stockout, and alert monitoring
- Forecasting and analytics pages
- AI assistant and recommendations support
- Data upload and report generation

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
