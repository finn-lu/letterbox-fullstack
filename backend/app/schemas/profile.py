from pydantic import BaseModel, Field

class ProfileResponse(BaseModel):
    """Response model for a user profile."""
    id: str
    user_id: str
    display_name: str | None = None
    birth_date: str | None = None
    avatar_url: str | None = None
    created_at: str
    updated_at: str
    
class UpdateProfileRequest(BaseModel):
    """Request model for updating a user profile."""
    display_name: str | None = Field(None, max_length=255)
    birth_date: str | None = None  # ISO format date string
    avatar_url: str | None = Field(None, max_length=2048)

class CreateProfileRequest(BaseModel):
    """Request model for creating a user profile."""
    display_name: str | None = Field(None, max_length=255)
    birth_date: str | None = None  # ISO format date string
    avatar_url: str | None = Field(None, max_length=2048)

