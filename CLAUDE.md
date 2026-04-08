# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenLPP v2** is a healthcare market benchmarking dashboard for analyzing AMELI (French social security) reimbursement data for LPP products (medical devices). Full-stack: FastAPI backend + React frontend + DuckDB analytics database.

## Development Commands

### Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API on http://localhost:8000
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173
```

### Windows quick-start
```bat
start.bat   # launches both services in separate console windows
```

### Frontend production build
```bash
cd frontend
npm run build   # outputs to frontend/dist/
```

## Database Configuration

The backend reads from a DuckDB database. Set the path via environment variable before starting the backend:

```bash
set OPENLPP_DB=C:\path\to\opendata_LPP.db   # Windows
export OPENLPP_DB=/path/to/opendata_LPP.db  # Linux/Mac
```

Default fallback (Windows-only): `O:\07_Projets\OpenLpp\OpenLppV2\data\opendata_LPP.db`

The `data/` directory is gitignored — the `.db` file must be provided separately.

## Architecture

### Backend (`backend/main.py`)

Single FastAPI file (~522 lines) with 12 read-only endpoints. All queries hit a single DuckDB connection via `get_db()`. All SQL uses parameterized queries.

**Key endpoints:**
- `/domaines` — hierarchical domain structure (domaine1 → domaine2 → domaine4)
- `/codes-lpp` — keyword search on LPP codes
- `/moyenne-nationale` — national avg reimbursement trends with YoY %
- `/prescripteurs` — top prescribers filtered by code/domain/regions
- `/evolution-domaine` / `/evolution` — indexed time series (base 100) by domain or code
- `/benchmark`, `/detail`, `/kpi-national`, `/top-codes` — supporting analytics

CORS is hard-coded to `localhost:5173` and `localhost:3000`.

**DuckDB tables:**
- `open_lpp` — fact table (CODE_LPP, ANNEE, BEN_REG, PSP_SPE, QTE, REM, BSE), years 2020–2024
- `ref_classification` — LPP code hierarchy (domaine1/2/3/4, exclure flag)
- `ref_specialites` — prescriber specialty lookup

### Frontend (`frontend/src/`)

Four pages, each a self-contained React component:
- **Dashboard.jsx** — KPI cards + top 10 codes bar chart for a selected year
- **Benchmark.jsx** — Main analysis: domain/code/region multi-select → indexed line chart → CSV/Excel export (`xlsx`)
- **Comparaison.jsx** — Regional bar chart with unit toggle (EUR / per 100k pop / per 10k)
- **Prescripteurs.jsx** — Top prescriber table + bar chart

`App.jsx` is the shell with sidebar navigation. `index.css` defines the design system (CSS variables: `--navy`, `--border`, `--text-secondary`, etc.).

Vite dev server proxies `/api/*` to `http://localhost:8000`.

## No Test Suite

There are no automated tests. Validation is manual.
