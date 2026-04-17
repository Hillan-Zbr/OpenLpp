# OpenLPP · Analyse de marché

Outil de benchmarking des remboursements LPP (données AMELI 2020–2024).

## Prérequis

- Python 3.10+
- Node.js 18+
- La base DuckDB : `O:\07_Projets\OpenLpp\OpenLppV2\data\opendata_LPP.db`

## Variables d'environnement

Un fichier `.env.example` est fourni a la racine du projet.

1. Copier le fichier :
```bash
cp .env.example .env
```
2. Adapter la variable `OPENLPP_DB` selon ton environnement.

## Lancement

### Terminal 1 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API disponible sur http://localhost:8000

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible sur http://localhost:5173

## Chemin de la base

Par défaut : `O:\07_Projets\OpenLpp\OpenLppV2\data\opendata_LPP.db`

Pour changer sans modifier le code :

```bash
set OPENLPP_DB=C:\autre\chemin\mabase.db
uvicorn main:app --reload
```

## Structure

```
backend/
  main.py          — API FastAPI (5 routes)
  requirements.txt

frontend/
  src/
    App.jsx        — Shell + navigation
    pages/
      Dashboard.jsx    — KPIs nationaux + top 10
      Benchmark.jsx    — Évolution marché (cas d'usage principal)
      Comparaison.jsx  — Répartition régionale
    index.css      — Design system complet
  index.html
  package.json
  vite.config.js
```
