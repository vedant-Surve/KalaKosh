import enum
import datetime

from sqlalchemy import (
    Column, Integer, String, Text, Float, ForeignKey, DateTime,
    Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    GUEST = "Guest"
    USER = "User"
    ADMIN = "Admin"


class ContributionStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.USER)
    # Trusted community contributor status — granted by admin
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    contributions = relationship("Contribution", back_populates="user", cascade="all, delete-orphan")


class ArtForm(Base):
    __tablename__ = "art_forms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    region = Column(String(150), nullable=True)

    artworks = relationship("Artwork", back_populates="art_form", cascade="all, delete-orphan")


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    art_form_id = Column(Integer, ForeignKey("art_forms.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    region = Column(String(150), nullable=True)
    is_verified = Column(Integer, default=1)  # 1 = verified/published, 0 = draft
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    art_form = relationship("ArtForm", back_populates="artworks")
    hotspots = relationship("Hotspot", back_populates="artwork", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="artwork", cascade="all, delete-orphan")


class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    artwork_id = Column(Integer, ForeignKey("artworks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    x_coordinate = Column(Float, nullable=False)  # percentage 0-100
    y_coordinate = Column(Float, nullable=False)  # percentage 0-100

    artwork = relationship("Artwork", back_populates="hotspots")
    stories = relationship("Story", back_populates="hotspot", cascade="all, delete-orphan")


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    hotspot_id = Column(Integer, ForeignKey("hotspots.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    meaning = Column(Text, nullable=True)      # ancestral / cosmic symbolism
    description = Column(Text, nullable=True)  # folklore narrative text
    language = Column(String(50), nullable=False, default="English")

    hotspot = relationship("Hotspot", back_populates="stories")
    audio_files = relationship("AudioFile", back_populates="story", cascade="all, delete-orphan")


class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    audio_url = Column(String(500), nullable=False)
    language = Column(String(50), nullable=False, default="English")
    duration = Column(Float, nullable=True)  # seconds

    story = relationship("Story", back_populates="audio_files")


class HeritageSite(Base):
    __tablename__ = "heritage_sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., WARLI-PALGHAR-01
    region = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    historical_significance = Column(Text, nullable=True)
    coordinates = Column(String(100), nullable=True)  # e.g., "19.6967° N, 72.7655° E"
    image_url = Column(String(500), nullable=True)
    art_form_id = Column(Integer, ForeignKey("art_forms.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    art_form = relationship("ArtForm")


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    artwork_id = Column(Integer, ForeignKey("artworks.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(250), nullable=True)
    category = Column(String(100), nullable=False, default="Regional Folklore")  # Regional Folklore, Tribal History, Folk Song, Ritual Traditions
    region = Column(String(150), nullable=True)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    admin_notes = Column(Text, nullable=True)
    status = Column(SAEnum(ContributionStatus), nullable=False, default=ContributionStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="contributions")
    artwork = relationship("Artwork", back_populates="contributions")
