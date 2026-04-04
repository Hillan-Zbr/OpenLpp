from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import duckdb
from typing import List, Optional
import os

app = FastAPI(title="OpenLPP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("OPENLPP_DB", r"O:\07_Projets\OpenLpp\OpenLppV2\data\opendata_LPP.db")

def get_db():
    return duckdb.connect(DB_PATH, read_only=True)

REGIONS = {
    5:  "Hauts-de-France",
    11: "Île-de-France",
    24: "Centre-Val de Loire",
    27: "Bourgogne-Franche-Comté",
    28: "Normandie",
    32: "Hauts-de-France (Nord)",
    44: "Grand Est",
    52: "Pays de la Loire",
    53: "Bretagne",
    75: "Nouvelle-Aquitaine",
    76: "Occitanie",
    84: "Auvergne-Rhône-Alpes",
    93: "Provence-Alpes-Côte d'Azur",
    99: "Hors métropole / Étranger",
}

@app.get("/regions")
def get_regions():
    return [{"code": k, "label": v} for k, v in sorted(REGIONS.items(), key=lambda x: x[1])]

@app.get("/codes-lpp")
def search_codes_lpp(q: str = Query(default="", min_length=0)):
    con = get_db()
    query = """
        SELECT DISTINCT CODE_LPP, L_CODE_LPP
        FROM open_lpp
        WHERE 1=1
    """
    params = []
    if q.strip():
        query += " AND (CAST(CODE_LPP AS VARCHAR) LIKE ? OR UPPER(L_CODE_LPP) LIKE UPPER(?))"
        params = [f"%{q}%", f"%{q}%"]
    query += " ORDER BY L_CODE_LPP LIMIT 50"
    rows = con.execute(query, params).fetchall()
    con.close()
    return [{"code": r[0], "label": f"{r[0]} — {r[1]}"} for r in rows]

@app.get("/evolution")
def get_evolution(
    code_lpp: int = Query(...),
    regions: List[int] = Query(...),
    year_start: int = Query(default=2020),
    year_end: int = Query(default=2024),
):
    con = get_db()
    placeholders_reg = ",".join(["?" for _ in regions])
    query = f"""
        SELECT
            ANNEE,
            BEN_REG,
            ROUND(SUM(REM) / 100000.0, 4) AS rem_x100k,
            SUM(QTE) AS qte_totale
        FROM open_lpp
        WHERE CODE_LPP = ?
          AND BEN_REG IN ({placeholders_reg})
          AND ANNEE BETWEEN ? AND ?
        GROUP BY ANNEE, BEN_REG
        ORDER BY ANNEE, BEN_REG
    """
    params = [code_lpp] + regions + [year_start, year_end]
    rows = con.execute(query, params).fetchall()
    con.close()

    # Build per-region series
    from collections import defaultdict
    series = defaultdict(lambda: {"rem": {}, "qte": {}})
    for annee, ben_reg, rem, qte in rows:
        label = REGIONS.get(ben_reg, str(ben_reg))
        series[label]["rem"][annee] = rem
        series[label]["qte"][annee] = qte

    years = list(range(year_start, year_end + 1))

    # Compute index base 100 (first available year = 100)
    result = []
    for region_label, data in series.items():
        rem_series = [data["rem"].get(y) for y in years]
        qte_series = [data["qte"].get(y) for y in years]

        # Base 100 index on first non-null value
        first_rem = next((v for v in rem_series if v is not None and v > 0), None)
        index_series = [
            round((v / first_rem) * 100, 2) if (v is not None and first_rem) else None
            for v in rem_series
        ]

        # YoY evolution %
        yoy = []
        for i, y in enumerate(years):
            if i == 0 or rem_series[i] is None or rem_series[i - 1] is None or rem_series[i - 1] == 0:
                yoy.append(None)
            else:
                yoy.append(round(((rem_series[i] - rem_series[i - 1]) / rem_series[i - 1]) * 100, 2))

        result.append({
            "region": region_label,
            "years": years,
            "rem_x100k": rem_series,
            "qte": qte_series,
            "index_base100": index_series,
            "yoy_pct": yoy,
        })

    return result

@app.get("/kpi-national")
def get_kpi_national(year: int = Query(default=2025)):
    con = get_db()
    query = """
        SELECT
            ROUND(SUM(REM) / 1000000.0, 2) AS rem_millions,
            SUM(QTE) AS qte_totale,
            COUNT(DISTINCT CODE_LPP) AS nb_codes
        FROM open_lpp
        WHERE ANNEE = ? AND BEN_REG != 99
    """
    row = con.execute(query, [year]).fetchone()
    con.close()
    return {
        "year": year,
        "rem_millions": row[0],
        "qte_totale": row[1],
        "nb_codes": row[2],
    }

@app.get("/evolution-nationale")
def get_evolution_nationale():
    con = get_db()
    query = """
        SELECT ANNEE, ROUND(SUM(REM) / 1000000.0, 2) AS rem_millions
        FROM open_lpp
        WHERE BEN_REG != 99
        GROUP BY ANNEE
        ORDER BY ANNEE
    """
    rows = con.execute(query).fetchall()
    con.close()
    return [{"annee": r[0], "rem_millions": r[1]} for r in rows]

@app.get("/top-codes")
def get_top_codes(year: int = Query(default=2024), limit: int = Query(default=10)):
    con = get_db()
    query = """
        SELECT CODE_LPP, L_CODE_LPP,
               ROUND(SUM(REM) / 1000000.0, 2) AS rem_millions
        FROM open_lpp
        WHERE ANNEE = ? AND BEN_REG != 99
        GROUP BY CODE_LPP, L_CODE_LPP
        ORDER BY rem_millions DESC
        LIMIT ?
    """
    rows = con.execute(query, [year, limit]).fetchall()
    con.close()
    return [{"code": r[0], "label": r[1], "rem_millions": r[2]} for r in rows]