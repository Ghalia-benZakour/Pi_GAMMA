<<<<<<< HEAD
# PI Assurance — Plateforme Actuarielle v4.0

Plateforme web complète d'assurance auto avec 3 espaces utilisateurs, backend FastAPI, frontend React, base SQL, modèles GLM actuariels, détection de dommages YOLO/Roboflow et chatbot Gemini.

---

## Architecture

```
PI-v4/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration & env vars
│   ├── database.py             # SQLAlchemy models + DB setup
│   ├── auth_service.py         # JWT auth + password hashing
│   ├── actuarial_models.py     # GLM Poisson, Gamma, Tweedie
│   ├── data_processor.py       # Pandas pipeline sur motor_insurance.csv
│   ├── gemini_service.py       # Gemini 1.5 Flash API client
│   ├── damage_service.py       # Roboflow/YOLO damage detection
│   ├── routes/
│   │   ├── auth.py             # /api/auth/*
│   │   ├── analysis.py         # /api/analysis/*
│   │   ├── pricing.py          # /api/pricing/*
│   │   ├── damage.py           # /api/damage/*
│   │   ├── chatbot.py          # /api/chatbot/*
│   │   └── developer.py        # /api/developer/*
│   ├── data/motor_insurance.csv
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js              # Router + auth guards
        ├── context/AuthContext.js
        ├── services/api.js
        ├── components/
        │   ├── layout/Sidebar.js
        │   ├── layout/Topbar.js
        │   ├── layout/AppLayout.js
        │   └── ui/ChatbotWidget.js
        └── pages/
            ├── assureur/       # Dashboard, Portfolio, EDA, Temporal, Simulation, Damage, History, Developer, Settings
            ├── assure/         # Home, Profil, Simulation, Damage, History
            └── developer/      # Overview (shared avec assureur/Developer)
```

---

## Démarrage rapide

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditez .env et ajoutez vos clés API (optionnel)

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

L'API démarre sur http://localhost:8000  
Documentation interactive : http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

L'interface démarre sur http://localhost:3000

---

## Comptes de démonstration

| Rôle        | Email                          | Mot de passe |
|-------------|-------------------------------|--------------|
| Assureur    | actuaire@pi-assurance.fr      | demo1234     |
| Assuré      | assure@pi-assurance.fr        | demo1234     |
| Développeur | dev@pi-assurance.fr           | demo1234     |

Créés automatiquement au démarrage. Visibles aussi via `/api/auth/demo-credentials`.

---

## Variables d'environnement (.env)

```env
DATABASE_URL=sqlite:///./assurance_auto.db
SECRET_KEY=CHANGE_THIS_IN_PRODUCTION
DATA_PATH=./data/motor_insurance.csv
GEMINI_API_KEY=           # Clé Google AI Studio — active le chatbot IA
ROBOFLOW_API_KEY=         # Clé Roboflow — active la détection réelle de dommages
ROBOFLOW_PROJECT=car-damage-detection
ROBOFLOW_VERSION=1
```

Sans clés API, l'application fonctionne en mode démo avec des réponses simulées.

---

## Fonctionnalités

### Espace Assureur
- Dashboard avec KPIs, graphiques, alertes
- Portefeuille : analyse par variable, fréquence, sévérité
- EDA : statistiques descriptives, distributions, importance des variables
- Analyse temporelle : évolution mensuelle/annuelle
- Tarification : simulation GLM (Poisson × Gamma, Tweedie), historique persisté
- Détection de dommages : upload image → analyse YOLO/Roboflow → estimation coût
- Monitoring : statut services, modèles, endpoints API

### Espace Assuré
- Simulation de prime simplifiée
- Déclaration sinistre avec upload photo
- Historique personnel (simulations + déclarations)

### Espace Développeur
- Métriques des modèles GLM
- Liste des endpoints API
- Statut DB, Gemini, Roboflow

### Chatbot Gemini
- Widget flottant sur toutes les pages
- Contextualisation selon la page et le rôle
- Mode fallback si GEMINI_API_KEY absent

---

## Routes API principales

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| POST | /api/auth/register | Inscription |
| GET  | /api/analysis/dashboard/stats | KPIs |
| GET  | /api/analysis/temporal | Évolution temporelle |
| GET  | /api/analysis/eda/summary | Résumé EDA |
| POST | /api/pricing/simulate | Simulation prime |
| GET  | /api/pricing/models | Modèles actuariels |
| POST | /api/damage/analyze | Analyse image dommage |
| POST | /api/chatbot/ask | Question Gemini |
| GET  | /api/developer/status | Statut système |
=======
# Pi_GAMMA
>>>>>>> 521f1c43967d78215e76b6dd45918d9bd0c8eb2d
