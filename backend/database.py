from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Models ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, unique=True, index=True, nullable=False)
    full_name  = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role       = Column(String, nullable=False, default="assure")  # assureur | assure | developer
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    simulations    = relationship("Simulation", back_populates="user", cascade="all, delete")
    damage_analyses = relationship("DamageAnalysis", back_populates="user", cascade="all, delete")
    chat_messages  = relationship("ChatMessage", back_populates="user", cascade="all, delete")


class Simulation(Base):
    __tablename__ = "simulations"
    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"))
    age                 = Column(String)
    experience          = Column(String)
    type_vehicule       = Column(String)
    puissance           = Column(String)
    region              = Column(String)
    historique_sinistres = Column(String)
    anciennete_contrat  = Column(String)
    frequence_estimee   = Column(Float)
    severite_estimee    = Column(Float)
    prime_pure          = Column(Float)
    niveau_risque       = Column(String)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="simulations")


class DamageAnalysis(Base):
    __tablename__ = "damage_analyses"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename         = Column(String)
    detected_parts   = Column(Text)   # JSON string
    damage_level     = Column(String)
    damage_type      = Column(String)  # external | internal | mixed
    cost_estimate_min = Column(Float)
    cost_estimate_max = Column(Float)
    confidence       = Column(Float)
    raw_predictions  = Column(Text)   # JSON string
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="damage_analyses")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    role_ctx   = Column(String)   # assureur | assure | developer
    user_msg   = Column(Text)
    bot_reply  = Column(Text)
    page_ctx   = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")


class Contract(Base):
    __tablename__ = "contracts"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True)
    reference       = Column(String, unique=True, index=True)
    full_name       = Column(String)
    region          = Column(String)
    type_vehicule   = Column(String)
    age_conducteur  = Column(String)
    prime           = Column(Float)
    nb_sinistres    = Column(Integer, default=0)
    statut          = Column(String, default="actif")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


def create_tables():
    Base.metadata.create_all(bind=engine)
