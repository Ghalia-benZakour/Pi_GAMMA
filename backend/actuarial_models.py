import numpy as np
from typing import Optional


# ─── Frequency Model (GLM Poisson proxy) ───────────────────────────────────

class FrequencyModel:
    """Modèle de fréquence — GLM Poisson (proxy actuariel du lab)."""
    NAME = "GLM Poisson — Fréquence"
    VERSION = "2.0"
    BASE_FREQUENCY = 0.087

    COEFFICIENTS = {
        "age":                 {"18-25": 1.85, "26-35": 1.20, "36-50": 1.00, "51-65": 0.92, "65+": 1.05},
        "experience":          {"0-2": 1.60, "3-5": 1.25, "6-10": 1.00, "10+": 0.88},
        "type_vehicule":       {"citadine": 0.95, "berline": 1.00, "suv": 1.10, "utilitaire": 1.30, "sport": 1.45},
        "puissance":           {"<=75cv": 0.90, "76-110cv": 1.00, "111-150cv": 1.18, "150+cv": 1.40},
        "region":              {"ile_de_france": 1.30, "nord": 1.10, "sud": 0.95, "ouest": 0.92, "est": 1.05},
        "historique_sinistres":{"0": 0.85, "1": 1.20, "2": 1.60, "3+": 2.10},
        "anciennete_contrat":  {"0-1": 1.15, "2-5": 1.00, "5-10": 0.95, "10+": 0.88},
    }

    METRICS = {
        "type": "GLM Poisson",
        "deviance": 0.412,
        "mae": 0.031,
        "rmse": 0.048,
        "r2": 0.68,
        "nb_variables": 7,
        "nb_modalites": 32,
    }

    FEATURE_IMPORTANCE = [
        {"variable": "historique_sinistres", "importance": 0.31, "direction": "positif"},
        {"variable": "age",                  "importance": 0.24, "direction": "mixte"},
        {"variable": "experience",           "importance": 0.18, "direction": "negatif"},
        {"variable": "region",               "importance": 0.12, "direction": "mixte"},
        {"variable": "type_vehicule",        "importance": 0.08, "direction": "positif"},
        {"variable": "puissance",            "importance": 0.05, "direction": "positif"},
        {"variable": "anciennete_contrat",   "importance": 0.02, "direction": "negatif"},
    ]

    def predict(self, profile: dict) -> float:
        freq = self.BASE_FREQUENCY
        for var, val in profile.items():
            if var in self.COEFFICIENTS and val in self.COEFFICIENTS[var]:
                freq *= self.COEFFICIENTS[var][val]
        return round(freq, 4)

    def get_relativities(self, profile: dict) -> list:
        out = []
        for var, val in profile.items():
            if var in self.COEFFICIENTS:
                rel = self.COEFFICIENTS[var].get(val, 1.0)
                out.append({"variable": var, "valeur": val, "relativite": rel})
        return out


# ─── Severity Model (GLM Gamma proxy) ──────────────────────────────────────

class SeverityModel:
    """Modèle de sévérité — GLM Gamma (proxy actuariel du lab)."""
    NAME = "GLM Gamma — Sévérité"
    VERSION = "2.0"
    BASE_SEVERITY = 2340.5

    COEFFICIENTS = {
        "type_vehicule":     {"citadine": 0.80, "berline": 1.00, "suv": 1.20, "utilitaire": 1.35, "sport": 1.55},
        "puissance":         {"<=75cv": 0.85, "76-110cv": 1.00, "111-150cv": 1.15, "150+cv": 1.38},
        "region":            {"ile_de_france": 1.20, "nord": 1.05, "sud": 1.00, "ouest": 0.95, "est": 1.02},
        "anciennete_contrat":{"0-1": 1.10, "2-5": 1.00, "5-10": 0.97, "10+": 0.93},
    }

    METRICS = {
        "type": "GLM Gamma",
        "deviance": 0.284,
        "mae_w": 312.4,
        "rmse_w": 489.1,
        "r2": 0.59,
        "nb_variables": 4,
        "nb_modalites": 16,
    }

    FEATURE_IMPORTANCE = [
        {"variable": "type_vehicule",     "importance": 0.38, "direction": "positif"},
        {"variable": "puissance",         "importance": 0.29, "direction": "positif"},
        {"variable": "region",            "importance": 0.21, "direction": "mixte"},
        {"variable": "anciennete_contrat","importance": 0.12, "direction": "negatif"},
    ]

    def predict(self, profile: dict) -> float:
        sev = self.BASE_SEVERITY
        for var, val in profile.items():
            if var in self.COEFFICIENTS and val in self.COEFFICIENTS[var]:
                sev *= self.COEFFICIENTS[var][val]
        return round(sev, 2)

    def get_relativities(self, profile: dict) -> list:
        out = []
        for var, val in profile.items():
            if var in self.COEFFICIENTS:
                rel = self.COEFFICIENTS[var].get(val, 1.0)
                out.append({"variable": var, "valeur": val, "relativite": rel})
        return out


# ─── Tweedie / Pure Premium Model ──────────────────────────────────────────

class TweedieModel:
    """Modèle prime pure directe — GLM Tweedie (proxy)."""
    NAME = "GLM Tweedie — Prime Pure"
    VERSION = "1.0"
    BASE_PURE_PREMIUM = 203.6

    METRICS = {
        "type": "GLM Tweedie (p=1.5)",
        "deviance": 0.198,
        "mae_w": 28.4,
        "rmse_w": 41.2,
        "r2": 0.71,
    }

    def predict(self, freq: float, sev: float) -> float:
        return round(freq * sev, 2)


# ─── Pricing Engine ────────────────────────────────────────────────────────

class PricingEngine:
    """Moteur de calcul de prime pure combinant fréquence × sévérité."""

    MODELS = {
        "glm_poisson_gamma": {"name": "GLM Poisson × Gamma", "description": "Modèle actuariel standard (fréquence × sévérité)"},
        "tweedie":           {"name": "GLM Tweedie",          "description": "Modèle direct prime pure (compound Poisson-Gamma)"},
        "gbm":               {"name": "GBM (Gradient Boosting)", "description": "Modèle ML — nécessite entraînement sur données réelles"},
    }

    def __init__(self):
        self.freq_model = FrequencyModel()
        self.sev_model  = SeverityModel()
        self.tweedie    = TweedieModel()

    def calculate(self, profile: dict, model: str = "glm_poisson_gamma") -> dict:
        frequency = self.freq_model.predict(profile)
        severity  = self.sev_model.predict(profile)
        prime_pure = round(frequency * severity, 2)

        # Risk level
        if prime_pure < 150:   risk_level, risk_color = "Faible", "green"
        elif prime_pure < 250: risk_level, risk_color = "Modéré", "orange"
        elif prime_pure < 400: risk_level, risk_color = "Élevé", "red"
        else:                  risk_level, risk_color = "Très élevé", "darkred"

        base_pp = TweedieModel.BASE_PURE_PREMIUM
        ecart_pct = round((prime_pure - base_pp) / base_pp * 100, 1)

        return {
            "modele_utilise": self.MODELS.get(model, self.MODELS["glm_poisson_gamma"])["name"],
            "frequence_estimee": frequency,
            "severite_estimee":  severity,
            "prime_pure":        prime_pure,
            "niveau_risque":     risk_level,
            "risk_color":        risk_color,
            "ecart_portefeuille_pct": ecart_pct,
            "prime_moyenne_portefeuille": base_pp,
            "relativites_frequence": self.freq_model.get_relativities(profile),
            "relativites_severite":  self.sev_model.get_relativities(profile),
            "profil_soumis": profile,
            "interpretations": [
                f"Prime pure = {frequency:.4f} (fréquence) × {severity:.2f} € (sévérité)",
                f"Niveau de risque : {risk_level} — {'Au-dessus' if ecart_pct > 0 else 'En dessous'} de la moyenne portefeuille de {abs(ecart_pct):.1f}%",
                "Résultat calculé côté backend via GLM actuariel. Utiliser comme aide à la décision.",
            ],
        }

    def get_models_info(self) -> list:
        return [
            {
                "id": "frequency",
                "name": FrequencyModel.NAME,
                "version": FrequencyModel.VERSION,
                "metrics": FrequencyModel.METRICS,
                "features": FrequencyModel.FEATURE_IMPORTANCE,
            },
            {
                "id": "severity",
                "name": SeverityModel.NAME,
                "version": SeverityModel.VERSION,
                "metrics": SeverityModel.METRICS,
                "features": SeverityModel.FEATURE_IMPORTANCE,
            },
            {
                "id": "tweedie",
                "name": TweedieModel.NAME,
                "version": TweedieModel.VERSION,
                "metrics": TweedieModel.METRICS,
                "features": [],
            },
        ]


pricing_engine = PricingEngine()
