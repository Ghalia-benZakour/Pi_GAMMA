from fastapi import APIRouter
from data_processor import processor

router = APIRouter()


@router.get("/dashboard/stats")
def dashboard_stats():
    ov = processor.get_portfolio_overview()
    return {
        "nb_contrats":    ov["nb_contrats"],
        "frequence":      ov["frequence"],
        "severite":       ov["severite"],
        "prime_pure":     ov["prime_pure"],
        "prime_moyenne":  ov["prime_moyenne"],
        "cout_total":     ov["cout_total"],
        "nb_sinistres":   ov["nb_sinistres"],
        "taux_sinistralite": ov["taux_sinistralite"],
    }


@router.get("/portfolio/overview")
def portfolio_overview():
    return processor.get_portfolio_overview()


@router.get("/portfolio/sample")
def portfolio_sample(limit: int = 50):
    return {"data": processor.get_sample(limit), "total": len(processor.df)}


@router.get("/portfolio/variables")
def portfolio_variables():
    return {"variables": processor.get_columns()}


@router.get("/portfolio/frequency/{variable}")
def frequency_by_variable(variable: str):
    return {"variable": variable, "data": processor.get_frequency_by_variable(variable)}


@router.get("/portfolio/severity/{variable}")
def severity_by_variable(variable: str):
    return {"variable": variable, "data": processor.get_severity_by_variable(variable)}


@router.get("/portfolio/distribution/{column}")
def distribution(column: str, bins: int = 20):
    return {"column": column, "data": processor.get_distribution(column, bins)}


@router.get("/eda/summary")
def eda_summary():
    return processor.get_eda_summary()


@router.get("/eda/correlations")
def eda_correlations():
    return {
        "variables_importantes": [
            {"variable": "Age_driver",        "importance": 0.24, "direction": "mixte",   "description": "Âge du conducteur"},
            {"variable": "Driving_experience","importance": 0.21, "direction": "negatif", "description": "Ancienneté du permis"},
            {"variable": "Vehicle_age",       "importance": 0.18, "direction": "positif", "description": "Âge du véhicule"},
            {"variable": "Area",              "importance": 0.16, "direction": "mixte",   "description": "Zone géographique"},
            {"variable": "Premium",           "importance": 0.15, "direction": "positif", "description": "Prime commerciale"},
            {"variable": "Exposure",          "importance": 0.06, "direction": "positif", "description": "Exposition"},
        ]
    }


@router.get("/temporal")
def temporal():
    return {"data": processor.get_temporal_evolution()}


@router.get("/database/info")
def database_info():
    return processor.get_db_info()
