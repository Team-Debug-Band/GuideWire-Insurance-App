# SurelyAI Monorepo

Welcome to the restructured SurelyAI monorepo. This repository contains both the frontend and backend services.

## Project Structure

- `apps/frontend`: React (Vite + TypeScript) application.
- `apps/backend`: FastAPI (Python) backend.
- `stitch/`: Legacy design/screen artifacts (Preserved).
- `diagrams/`: Architectural diagrams.

## Setup Instructions

### 1. Environment Variables
Copy the example environment file and fill in the required keys:
```bash
cp .env.example .env
```
*Note: Some keys are needed by the frontend (VITE_*) and some by the backend.*

### 2. Frontend Setup
```bash
cd apps/frontend
npm install
```

### 3. Backend Setup
It is recommended to use a virtual environment:
```bash
cd apps/backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Unix:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

## Development

From the root directory, you can run:

- **Frontend**: `npm run dev:frontend` (Runs on http://localhost:3000)
- **Backend**: `npm run dev:backend` (Runs on http://localhost:8000)
- **Install All Frontend Deps**: `npm run install:all`

### Proxy Configuration
The frontend is configured to proxy `/api` calls to the backend at `http://localhost:8000`. Ensure the backend is running for full functionality.

## Deployment
Both services can be deployed independently from their respective directories in `apps/`.
