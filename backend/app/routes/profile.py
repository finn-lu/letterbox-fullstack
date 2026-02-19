from fastapi import APIRouter, Header, HTTPException, status
from app.database import supabase, supabase_admin
from app.schemas.profile import ProfileResponse, UpdateProfileRequest
from app.routes.auth import _extract_bearer_token

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
def get_profile(authorization: str | None = Header(default=None)):
    """Get current user's profile."""
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    try:
        result = (
            supabase.table("profiles")
            .select("*")
            .eq("user_id", user.id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}",
        )

    # If profile doesn't exist, create an empty one
    if not result.data:
        if not supabase_admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Server is missing SUPABASE_SERVICE_ROLE_KEY to create one.",
            )

        try:
            create_result = (
                supabase_admin.table("profiles")
                .upsert({"user_id": user.id}, on_conflict="user_id")
                .execute()
            )
            profile_data = create_result.data[0]
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create profile: {exc}",
            )
    else:
        profile_data = result.data[0]

    return ProfileResponse(
        id=profile_data["id"],
        user_id=profile_data["user_id"],
        display_name=profile_data.get("display_name"),
        birth_date=profile_data.get("birth_date"),
        avatar_url=profile_data.get("avatar_url"),
        created_at=profile_data.get("created_at", ""),
        updated_at=profile_data.get("updated_at", ""),
    )


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    payload: UpdateProfileRequest,
    authorization: str | None = Header(default=None),
):
    """Update current user's profile."""
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Build update dict with only non-None values
    update_data = {}
    if payload.display_name is not None:
        update_data["display_name"] = payload.display_name
    if payload.birth_date is not None:
        update_data["birth_date"] = payload.birth_date
    if payload.avatar_url is not None:
        update_data["avatar_url"] = payload.avatar_url

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    try:
        client = supabase_admin or supabase
        result = (
            client.table("profiles")
            .update(update_data)
            .eq("user_id", user.id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {exc}",
        )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    profile_data = result.data[0]

    return ProfileResponse(
        id=profile_data["id"],
        user_id=profile_data["user_id"],
        display_name=profile_data.get("display_name"),
        birth_date=profile_data.get("birth_date"),
        avatar_url=profile_data.get("avatar_url"),
        created_at=profile_data.get("created_at", ""),
        updated_at=profile_data.get("updated_at", ""),
    )