from fastapi import APIRouter
from config import GEMINI_API_KEY, ROBOFLOW_API_KEY, DATABASE_URL, DATA_PATH
from actuarial_models import pricing_engine
from data_processor import processor

router = APIRouter()


@router.get("/status")
def system_status():
    return {
        "api":      {"status": "operational", "version": "4.0.0"},
        "database": {"status": "connected", "url": DATABASE_URL.split("///")[0] + "///***"},
        "gemini":   {"status": "configured" if GEMINI_API_KEY else "not_configured",
                     "configured": bool(GEMINI_API_KEY)},
        "roboflow": {"status": "configured" if ROBOFLOW_API_KEY else "not_configured",
                     "configured": bool(ROBOFLOW_API_KEY)},
        "data":     {"status": "loaded", "rows": len(processor.df), "columns": processor.df.shape[1]},
    }


@router.get("/models")
def list_models():
    return {"models": pricing_engine.get_models_info()}


@router.get("/endpoints")
def list_endpoints():
    return {
        "endpoints": [
            {"method": "POST", "path": "/api/auth/register",        "description": "Créer un compte"},
            {"method": "POST", "path": "/api/auth/login",           "description": "Se connecter"},
            {"method": "GET",  "path": "/api/auth/me",              "description": "Profil courant"},
            {"method": "GET",  "path": "/api/analysis/dashboard/stats", "description": "KPIs dashboard"},
            {"method": "GET",  "path": "/api/analysis/portfolio/overview", "description": "Vue portefeuille"},
            {"method": "GET",  "path": "/api/analysis/portfolio/sample",   "description": "Échantillon données"},
            {"method": "GET",  "path": "/api/analysis/portfolio/frequency/{variable}", "description": "Fréquence par variable"},
            {"method": "GET",  "path": "/api/analysis/portfolio/severity/{variable}",  "description": "Sévérité par variable"},
            {"method": "GET",  "path": "/api/analysis/eda/summary", "description": "Résumé statistique EDA"},
            {"method": "GET",  "path": "/api/analysis/temporal",    "description": "Évolution temporelle"},
            {"method": "POST", "path": "/api/pricing/simulate",     "description": "Simulation prime"},
            {"method": "GET",  "path": "/api/pricing/models",       "description": "Modèles actuariels"},
            {"method": "GET",  "path": "/api/pricing/options",      "description": "Options simulation"},
            {"method": "GET",  "path": "/api/pricing/history",      "description": "Historique simulations"},
            {"method": "POST", "path": "/api/damage/analyze",       "description": "Analyser dommages image"},
            {"method": "GET",  "path": "/api/damage/history",       "description": "Historique analyses"},
            {"method": "POST", "path": "/api/chatbot/ask",          "description": "Chatbot Gemini"},
            {"method": "GET",  "path": "/api/developer/status",     "description": "Statut système"},
        ]
    }


@router.get("/database/info")
def database_info():
    return processor.get_db_info()
