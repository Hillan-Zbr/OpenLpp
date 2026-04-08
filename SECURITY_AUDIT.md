# Rapport de sécurité — OpenLPP v2

> Généré le 2026-04-06 · Stack : React 18 + FastAPI + DuckDB

---

## CRITIQUE 🔴

### 1. Aucune authentification
L'API est entièrement publique — n'importe qui connaissant l'URL peut interroger toutes les données AMELI.

**→ Solution :** Ajouter au minimum une API key via un header `X-API-Key`, ou placer un reverse proxy (Nginx/Caddy) avec auth basique devant l'API.

---

### 2. Chemin absolu hardcodé
```python
# backend/main.py ligne 16
DB_PATH = os.environ.get("OPENLPP_DB", r"O:\07_Projets\OpenLpp\OpenLppV2\data\opendata_LPP.db")
```
**→ Solution :** Supprimer le fallback hardcodé. Rendre `OPENLPP_DB` obligatoire et lever une erreur explicite si absent.

---

### 3. Pas de HTTPS
Aucune configuration TLS. En HTTP, les données transitent en clair.

**→ Solution :** Utiliser Caddy ou Nginx avec Let's Encrypt devant Uvicorn.

---

## IMPORTANT 🟠

### 4. `--reload` uvicorn à désactiver en production
Le flag `--reload` (dans `start.bat`) surveille les fichiers et peut exposer des infos de debug.

**→ Solution :** Créer un script de lancement production séparé sans `--reload`.

---

### 5. Pas de rate limiting
Les endpoints `/codes-lpp`, `/prescripteurs`, `/detail` peuvent être interrogés en boucle sans limite.

**→ Solution :**
```bash
pip install slowapi
```
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

@app.get("/prescripteurs")
@limiter.limit("30/minute")
def get_prescripteurs(...):
```

---

### 6. Headers HTTP de sécurité absents
Aucun `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, `HSTS`.

**→ Solution :** Ajouter un middleware FastAPI :
```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

---

### 7. CORS trop permissif sur les méthodes et headers
```python
allow_methods=["*"], allow_headers=["*"]  # trop large
```
**→ Solution :** L'API n'expose que des GET :
```python
allow_methods=["GET"],
allow_headers=["Content-Type"],
```

---

### 8. Paramètre `limit` non plafonné côté serveur
Le paramètre `limit` est passé directement à `LIMIT ?` sans maximum serveur.

**→ Solution :**
```python
limit: int = Query(default=10, ge=1, le=100)
```

---

## MINEUR 🟡

### 9. `xlsx` version 0.18.5 obsolète
Cette version présente des vulnérabilités connues. Le package SheetJS original a changé de modèle de licence.

**→ Solution :** Évaluer le remplacement par `exceljs`.

---

### 10. Pas de `.env.example`
Aucun fichier exemple documentant les variables d'environnement attendues.

**→ Solution :** Créer `.env.example` :
```
OPENLPP_DB=/chemin/vers/opendata_LPP.db
```

---

### 11. Erreurs DuckDB non gérées
Si la DB est absente ou corrompue, FastAPI renvoie une stack trace Python complète au client.

**→ Solution :**
```python
from fastapi import HTTPException

def get_db():
    try:
        return duckdb.connect(DB_PATH, read_only=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail="Base de données indisponible")
```

---

## OK ✅

- Requêtes SQL 100% paramétrées → pas d'injection SQL
- `.gitignore` couvre `.env` et `data/` → pas de secrets ni de DB dans git
- DuckDB en `read_only=True` → impossible d'écrire en base via l'API
- Pas de secrets dans les fichiers trackés
- Données publiques AMELI (open data) → sensibilité limitée

---

## Prochaines étapes recommandées

| Priorité | Action |
|----------|--------|
| 1 | Ajouter une auth (API key ou auth basique via reverse proxy) |
| 2 | Configurer HTTPS avec Caddy |
| 3 | Restreindre CORS aux méthodes GET uniquement |
| 4 | Désactiver `--reload` en production |
| 5 | Ajouter rate limiting avec `slowapi` |
| 6 | Gérer les exceptions DuckDB proprement |
