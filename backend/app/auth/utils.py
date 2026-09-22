import re
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username:
    - At least 5 characters
    - Must contain both uppercase and lowercase letters
    """
    if len(username) < 5:
        return False, "Username must be at least 5 characters long."
    if not re.search(r"[a-z]", username):
        return False, "Username must contain at least one lowercase letter."
    if not re.search(r"[A-Z]", username):
        return False, "Username must contain at least one uppercase letter."
    if not username.isalpha():
        return False, "Username must contain only alphabetic characters."
    return True, ""


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password:
    - At least 5 characters
    - Must contain alpha, numeric, and one of special characters ($, %, *, and)
    """
    if len(password) < 5:
        return False, "Password must be at least 5 characters long."
    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[$%*&]", password):
        return False, "Password must contain at least one special character ($, %, *, &)."
    return True, ""
