from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables, SessionLocal
from auth_service import seed_demo_users
from routes.auth     import router as auth_router
from routes.analysis import router as analysis_router
from routes.pricing  import router as pricing_router
from routes.damage   import router as damage_router
from routes.chatbot  import router as chatbot_router
from routes.developer import router as developer_router

app = FastAPI(
    title="PI Assurance — Plateforme Actuarielle",
    version="4.0.0",
    description="API complète assurance auto : actuariat, détection dommages, chatbot IA",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(analysis_router,  prefix="/api/analysis",  tags=["Analyse"])
app.include_router(pricing_router,   prefix="/api/pricing",   tags=["Tarification"])
app.include_router(damage_router,    prefix="/api/damage",    tags=["Dommages"])
app.include_router(chatbot_router,   prefix="/api/chatbot",   tags=["Chatbot"])
app.include_router(developer_router, prefix="/api/developer", tags=["Developer"])


@app.on_event("startup")
def startup():
    create_tables()
    db = SessionLocal()
    try:
        seed_demo_users(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "PI Assurance API opérationnelle", "version": "4.0.0", "docs": "/docs"}
