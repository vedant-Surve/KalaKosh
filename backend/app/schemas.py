import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from .models import UserRole, ContributionStatus


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_verified: bool = False


class UserAdminOut(BaseModel):
    """Extended user view for admin management panel."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_verified: bool
    created_at: datetime.datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Art Forms ----------

class ArtFormBase(BaseModel):
    name: str
    description: Optional[str] = None
    region: Optional[str] = None


class ArtFormCreate(ArtFormBase):
    pass


class ArtFormOut(ArtFormBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Audio Files ----------

class AudioFileBase(BaseModel):
    audio_url: str
    language: str = "English"
    duration: Optional[float] = None


class AudioFileCreate(AudioFileBase):
    story_id: int


class AudioFileOut(AudioFileBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Stories ----------

class StoryBase(BaseModel):
    title: str
    meaning: Optional[str] = None
    description: Optional[str] = None
    language: str = "English"


class StoryCreate(StoryBase):
    hotspot_id: int


class StoryOut(StoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    audio_files: List[AudioFileOut] = []


# ---------- Hotspots ----------

class HotspotBase(BaseModel):
    name: str
    x_coordinate: float = Field(ge=0, le=100)
    y_coordinate: float = Field(ge=0, le=100)


class HotspotCreate(HotspotBase):
    artwork_id: int


class HotspotOut(HotspotBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stories: List[StoryOut] = []


# ---------- Artworks ----------

class ArtworkBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    region: Optional[str] = None


class ArtworkCreate(ArtworkBase):
    art_form_id: int


class ArtworkListOut(ArtworkBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    art_form_id: int
    is_verified: int
    hotspot_count: int = 0


class ArtworkDetailOut(ArtworkBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    art_form_id: int
    is_verified: int
    art_form: ArtFormOut
    hotspots: List[HotspotOut] = []


# ---------- Heritage Sites (QR Code Scanner & Historical Locations) ----------

class HeritageSiteBase(BaseModel):
    name: str
    code: str
    region: str
    state: str
    description: Optional[str] = None
    historical_significance: Optional[str] = None
    coordinates: Optional[str] = None
    image_url: Optional[str] = None
    art_form_id: Optional[int] = None


class HeritageSiteCreate(HeritageSiteBase):
    pass


class HeritageSiteOut(HeritageSiteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime.datetime
    art_form: Optional[ArtFormOut] = None


class HeritageSiteDetailOut(HeritageSiteOut):
    model_config = ConfigDict(from_attributes=True)
    related_artworks: List[ArtworkListOut] = []


# ---------- Contributions ----------

class ContributionCreate(BaseModel):
    artwork_id: Optional[int] = None
    title: Optional[str] = Field(default=None, max_length=250)
    category: str = Field(default="Regional Folklore", max_length=100)
    region: Optional[str] = Field(default=None, max_length=150)
    content: str = Field(min_length=10, max_length=5000)
    image_url: Optional[str] = None


class ContributionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    artwork_id: Optional[int] = None
    title: Optional[str] = None
    category: str
    region: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    status: ContributionStatus
    created_at: datetime.datetime


class ContributionOutRich(BaseModel):
    """Enriched view for community archive cards and admin moderation queue."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    artwork_id: Optional[int] = None
    title: Optional[str] = None
    category: str = "Regional Folklore"
    region: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    admin_notes: Optional[str] = None
    status: ContributionStatus
    created_at: datetime.datetime
    contributor_name: Optional[str] = None
    contributor_is_verified: bool = True
    artwork_title: Optional[str] = None


# ---------- Admin dashboard metrics ----------

class DashboardMetrics(BaseModel):
    total_verified_artworks: int
    live_pins: int
    narrated_stories: int
    pending_review: int
    total_users: int
    verified_contributors: int
    total_heritage_sites: int = 0


# ---------- Pratyaksha Chatbot ----------

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: List[ChatMessage] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    model: str

