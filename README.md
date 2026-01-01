# Hyperlocal Delivery — CVRPTW

A small platform demonstrating hyperlocal delivery routing and order management using:

- FastAPI backend (Python)
- React + Vite frontend (TypeScript)
- GraphHopper for routing / vehicle routing problem (CVRPTW)

## Features

- Create and manage orders
- Rider & admin dashboards
- Route planning using GraphHopper

## Prerequisites

- Python 3.10+ (for backend)
- Node.js 18+ and npm (for frontend)
- Java 11+ (for running GraphHopper)

## Quick start

1) Backend

 - Create and activate a virtual environment(Optional but recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

 - Install dependencies and initialize DB:

```powershell
pip install -r backend/requirements.txt
python backend/init_db.py
```

 - Run the FastAPI server (development):

```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 (or the URL printed by Vite).

3) GraphHopper (optional — for routing)

 - Import OSM data and build the graph (example):

```bash
java -Xmx8g -jar graphhopper-web-11.0.jar import config.yml
```

 - Start the GraphHopper server:

```bash
java -Xmx4g -Xms4g -jar graphhopper-web-11.0.jar server config.yml
```

## Project layout

- `backend/` — FastAPI app, DB models, routing and utilities
- `frontend/` — React + Vite UI
- `graphhopper/` — GraphHopper config and OSM data
