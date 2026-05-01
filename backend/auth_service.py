from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    return user


def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    return user


def require_role(*roles: str):
    def checker(user: User = Depends(require_auth)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        return user
    return checker


def seed_demo_users(db: Session):
    """Create demo users if they don't exist."""
    demos = [
        {"email": "actuaire@pi-assurance.fr",   "full_name": "Actuaire Principal",  "role": "assureur",  "password": "demo1234"},
        {"email": "assure@pi-assurance.fr",      "full_name": "Jean Dupont",          "role": "assure",    "password": "demo1234"},
        {"email": "dev@pi-assurance.fr",         "full_name": "Dev Tech",             "role": "developer", "password": "demo1234"},
    ]
    for d in demos:
        if not db.query(User).filter(User.email == d["email"]).first():
            db.add(User(
                email=d["email"],
                full_name=d["full_name"],
                role=d["role"],
                hashed_password=hash_password(d["password"]),
            ))
    db.commit()
