from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db, User
from auth_service import hash_password, verify_password, create_access_token, get_current_user, require_auth

router = APIRouter()


class RegisterInput(BaseModel):
    email:     str
    full_name: str
    password:  str
    role:      str = "assure"


class LoginInput(BaseModel):
    email:    str
    password: str


@router.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    if data.role not in ("assureur", "assure", "developer"):
        raise HTTPException(status_code=400, detail="Rôle invalide")
    user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}


@router.post("/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}}


@router.get("/me")
def me(user: User = Depends(require_auth)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}


@router.get("/demo-credentials")
def demo_credentials():
    return {
        "comptes_demo": [
            {"role": "assureur",  "email": "actuaire@pi-assurance.fr",  "password": "demo1234"},
            {"role": "assure",    "email": "assure@pi-assurance.fr",     "password": "demo1234"},
            {"role": "developer", "email": "dev@pi-assurance.fr",        "password": "demo1234"},
        ]
    }
