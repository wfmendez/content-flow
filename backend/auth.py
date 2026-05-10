"""
JWT authentication utilities.
Uses a single hardcoded demo user for portfolio purposes.
In production: replace with a proper User table and registration flow.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-hash the demo password at module load time
_DEMO_HASH = pwd_context.hash(settings.DEMO_PASSWORD)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Schemas ───────────────────────────────────────────────────────────────────
class TokenData(BaseModel):
    email: str


class UserOut(BaseModel):
    email: str
    name: str
    role: str = "admin"


# ── Helpers ───────────────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def authenticate_user(email: str, password: str) -> Optional[UserOut]:
    """Returns UserOut if credentials match the demo user, else None."""
    if email.lower() != settings.DEMO_EMAIL.lower():
        return None
    if not verify_password(password, _DEMO_HASH):
        return None
    return UserOut(email=settings.DEMO_EMAIL, name="Demo User", role="admin")


def create_access_token(email: str) -> str:
    expires = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": email, "exp": expires}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise credentials_exc
    except JWTError:
        raise credentials_exc
    return UserOut(email=email, name="Demo User", role="admin")
