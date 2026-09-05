import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------- Dashboard ----------

@router.get("/metrics", response_model=schemas.DashboardMetrics)
def dashboard_metrics(db: Session = Depends(get_db), _admin: models.User = Depends(auth.require_admin)):
    total_verified_artworks = (
        db.query(models.Artwork).filter(models.Artwork.is_verified == 1).count()
    )
    live_pins = db.query(models.Hotspot).count()
    narrated_stories = (
        db.query(models.Story)
        .join(models.AudioFile, models.AudioFile.story_id == models.Story.id)
        .distinct()
        .count()
    )
    pending_review = (
        db.query(models.Contribution)
        .filter(models.Contribution.status == models.ContributionStatus.PENDING)
        .count()
    )
    total_users = db.query(models.User).filter(models.User.role != models.UserRole.ADMIN).count()
    verified_contributors = (
        db.query(models.User)
        .filter(models.User.is_verified == True, models.User.role != models.UserRole.ADMIN)
        .count()
    )
    total_heritage_sites = db.query(models.HeritageSite).count()
    return schemas.DashboardMetrics(
        total_verified_artworks=total_verified_artworks,
        live_pins=live_pins,
        narrated_stories=narrated_stories,
        pending_review=pending_review,
        total_users=total_users,
        verified_contributors=verified_contributors,
        total_heritage_sites=total_heritage_sites,
    )


# ---------- User Management ----------

@router.get("/users", response_model=List[schemas.UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    """Return all non-admin users ordered by registration date."""
    return (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .all()
    )


@router.put("/users/{user_id}/verify", response_model=schemas.UserAdminOut)
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    """Grant trusted community contributor status to a user."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot modify admin accounts.")
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/unverify", response_model=schemas.UserAdminOut)
def unverify_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    """Revoke trusted community contributor status."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot modify admin accounts.")
    user.is_verified = False
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/promote", response_model=schemas.UserAdminOut)
def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    """Promote a user to Admin role."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.role = models.UserRole.ADMIN
    user.is_verified = True  # admins are implicitly verified
    db.commit()
    db.refresh(user)
    return user


# ---------- Art Forms ----------

@router.post("/art-forms", response_model=schemas.ArtFormOut, status_code=201)
def create_art_form(
    payload: schemas.ArtFormCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    art_form = models.ArtForm(**payload.model_dump())
    db.add(art_form)
    db.commit()
    db.refresh(art_form)
    return art_form


# ---------- Artworks ----------

@router.post("/artworks", response_model=schemas.ArtworkListOut, status_code=201)
def create_artwork(
    payload: schemas.ArtworkCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    art_form = db.query(models.ArtForm).filter(models.ArtForm.id == payload.art_form_id).first()
    if not art_form:
        raise HTTPException(status_code=404, detail="Art form not found.")

    artwork = models.Artwork(**payload.model_dump(), is_verified=1)
    db.add(artwork)
    db.commit()
    db.refresh(artwork)

    out = schemas.ArtworkListOut.model_validate(artwork)
    out.hotspot_count = 0
    return out


# ---------- Hotspots (Visual Hotspot Mapper) ----------

@router.post("/hotspots", response_model=schemas.HotspotOut, status_code=201)
def create_hotspot(
    payload: schemas.HotspotCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    artwork = db.query(models.Artwork).filter(models.Artwork.id == payload.artwork_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found.")

    hotspot = models.Hotspot(
        artwork_id=payload.artwork_id,
        name=payload.name,
        x_coordinate=payload.x_coordinate,
        y_coordinate=payload.y_coordinate,
    )
    db.add(hotspot)
    db.commit()
    db.refresh(hotspot)
    return hotspot


@router.delete("/hotspots/{hotspot_id}", status_code=204)
def delete_hotspot(
    hotspot_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    hotspot = db.query(models.Hotspot).filter(models.Hotspot.id == hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")
    db.delete(hotspot)
    db.commit()
    return None


# ---------- Stories ----------

@router.post("/stories", response_model=schemas.StoryOut, status_code=201)
def create_story(
    payload: schemas.StoryCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    hotspot = db.query(models.Hotspot).filter(models.Hotspot.id == payload.hotspot_id).first()
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    story = models.Story(**payload.model_dump())
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


# ---------- Audio Upload ----------

ALLOWED_AUDIO_EXT = {".mp3", ".wav", ".m4a", ".ogg"}


@router.post("/audio", response_model=schemas.AudioFileOut, status_code=201)
async def upload_audio(
    story_id: int = Form(...),
    language: str = Form("English"),
    duration: float = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    story = db.query(models.Story).filter(models.Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format '{ext}'.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large.")

    with open(stored_path, "wb") as f:
        f.write(contents)

    audio_url = f"/static/{stored_name}"
    audio = models.AudioFile(
        story_id=story_id, audio_url=audio_url, language=language, duration=duration
    )
    db.add(audio)
    db.commit()
    db.refresh(audio)
    return audio


# ---------- Heritage Sites Management ----------

@router.post("/heritage-sites", response_model=schemas.HeritageSiteOut, status_code=201)
def create_heritage_site(
    payload: schemas.HeritageSiteCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    existing = db.query(models.HeritageSite).filter(models.HeritageSite.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Heritage site with code '{payload.code}' already exists.")

    site = models.HeritageSite(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.put("/heritage-sites/{site_id}", response_model=schemas.HeritageSiteOut)
def update_heritage_site(
    site_id: int,
    payload: schemas.HeritageSiteCreate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    site = db.query(models.HeritageSite).filter(models.HeritageSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Heritage site not found.")

    for k, v in payload.model_dump().items():
        setattr(site, k, v)

    db.commit()
    db.refresh(site)
    return site


@router.delete("/heritage-sites/{site_id}", status_code=204)
def delete_heritage_site(
    site_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    site = db.query(models.HeritageSite).filter(models.HeritageSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Heritage site not found.")
    db.delete(site)
    db.commit()
    return None


# ---------- Contributions moderation ----------

@router.get("/contributions", response_model=List[schemas.ContributionOutRich])
def list_contributions(
    db: Session = Depends(get_db), _admin: models.User = Depends(auth.require_admin)
):
    """Return all contributions enriched with contributor name and artwork title."""
    contributions = (
        db.query(models.Contribution)
        .order_by(models.Contribution.created_at.desc())
        .all()
    )
    results = []
    for c in contributions:
        item = schemas.ContributionOutRich.model_validate(c)
        item.contributor_name = c.user.name if c.user else None
        item.contributor_is_verified = c.user.is_verified if c.user else False
        item.artwork_title = c.artwork.title if c.artwork else None
        results.append(item)
    return results


@router.put("/contributions/{contribution_id}/approve", response_model=schemas.ContributionOut)
def approve_contribution(
    contribution_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    contribution = (
        db.query(models.Contribution).filter(models.Contribution.id == contribution_id).first()
    )
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found.")
    contribution.status = models.ContributionStatus.APPROVED
    db.commit()
    db.refresh(contribution)
    return contribution


@router.put("/contributions/{contribution_id}/reject", response_model=schemas.ContributionOut)
def reject_contribution(
    contribution_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    contribution = (
        db.query(models.Contribution).filter(models.Contribution.id == contribution_id).first()
    )
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found.")
    contribution.status = models.ContributionStatus.REJECTED
    db.commit()
    db.refresh(contribution)
    return contribution
