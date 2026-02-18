from fastapi import APIRouter, Header, HTTPException, status

from app.database import supabase
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _as_iso_string(value: object) -> str | None:
    if value is None:
        return None

    iso_candidate = getattr(value, "isoformat", None)
    if callable(iso_candidate):
        return iso_candidate()

    return str(value)


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format",
        )

    return token


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    normalized_email = payload.email.strip().lower()

    if "@" not in normalized_email or "." not in normalized_email.rsplit("@", 1)[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed: invalid email format",
        )

    try:
        auth_result = supabase.auth.sign_up(
            {
                "email": normalized_email,
                "password": payload.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {exc}",
        )

    user = getattr(auth_result, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed: no user returned",
        )

    # Auto-create empty profile for new user
    try:
        supabase.table("profiles").insert({"user_id": user.id}).execute()
    except Exception as exc:
        # Log but don't fail registration if profile creation fails
        print(f"Warning: Failed to create profile for user {user.id}: {exc}")

    return RegisterResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            email_confirmed_at=_as_iso_string(user.email_confirmed_at),
        ),
        email_confirmation_required=not bool(user.email_confirmed_at),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    normalized_email = payload.email.strip().lower()

    if "@" not in normalized_email or "." not in normalized_email.rsplit("@", 1)[-1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login failed: invalid email format",
        )

    try:
        auth_result = supabase.auth.sign_in_with_password(
            {
                "email": normalized_email,
                "password": payload.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {exc}",
        )

    session = getattr(auth_result, "session", None)
    user = getattr(auth_result, "user", None)

    if not session or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or unconfirmed account",
        )

    return AuthResponse(
        user=UserResponse(
            id=user.id,
            email=user.email,
            email_confirmed_at=_as_iso_string(user.email_confirmed_at),
        ),
        access_token=session.access_token,
        refresh_token=session.refresh_token,
    )


@router.get("/me", response_model=UserResponse)
def me(authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for token",
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        email_confirmed_at=_as_iso_string(user.email_confirmed_at),
    )
