from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(tags=["Public"])


@router.get("/art-forms", response_model=List[schemas.ArtFormOut])
def list_art_forms(db: Session = Depends(get_db)):
    return db.query(models.ArtForm).order_by(models.ArtForm.name).all()


@router.get("/artworks", response_model=List[schemas.ArtworkListOut])
def list_artworks(
    art_form_id: Optional[int] = Query(default=None),
    region: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(
        models.Artwork,
        func.count(models.Hotspot.id).label("hotspot_count"),
    ).outerjoin(models.Hotspot).filter(models.Artwork.is_verified == 1)

    if art_form_id:
        query = query.filter(models.Artwork.art_form_id == art_form_id)
    if region:
        query = query.filter(models.Artwork.region == region)

    query = query.group_by(models.Artwork.id).order_by(models.Artwork.created_at.desc())

    results = []
    for artwork, hotspot_count in query.all():
        item = schemas.ArtworkListOut.model_validate(artwork)
        item.hotspot_count = hotspot_count
        results.append(item)
    return results


@router.get("/artworks/{artwork_id}", response_model=schemas.ArtworkDetailOut)
def get_artwork_detail(artwork_id: int, db: Session = Depends(get_db)):
    artwork = (
        db.query(models.Artwork)
        .options(
            joinedload(models.Artwork.art_form),
            joinedload(models.Artwork.hotspots)
            .joinedload(models.Hotspot.stories)
            .joinedload(models.Story.audio_files),
        )
        .filter(models.Artwork.id == artwork_id)
        .first()
    )
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found.")
    return artwork


# ---------- Heritage Sites (QR Code Scanner) ----------

@router.get("/heritage-sites", response_model=List[schemas.HeritageSiteOut])
def list_heritage_sites(
    art_form_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    """List all documented historical heritage sites."""
    query = db.query(models.HeritageSite).options(joinedload(models.HeritageSite.art_form))
    if art_form_id:
        query = query.filter(models.HeritageSite.art_form_id == art_form_id)
    return query.order_by(models.HeritageSite.name).all()


@router.get("/heritage-sites/{site_id_or_code}", response_model=schemas.HeritageSiteDetailOut)
def get_heritage_site_detail(
    site_id_or_code: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve historical heritage site by ID or unique QR code (e.g. WARLI-PALGHAR-01),
    including linked tradition and related gallery artworks.
    """
    query = db.query(models.HeritageSite).options(joinedload(models.HeritageSite.art_form))
    if site_id_or_code.isdigit():
        site = query.filter(models.HeritageSite.id == int(site_id_or_code)).first()
    else:
        site = query.filter(models.HeritageSite.code == site_id_or_code).first()

    if not site:
        raise HTTPException(status_code=404, detail=f"Heritage site '{site_id_or_code}' not found.")

    # Find related artworks from same art form or matching region
    related_query = db.query(
        models.Artwork,
        func.count(models.Hotspot.id).label("hotspot_count"),
    ).outerjoin(models.Hotspot).filter(models.Artwork.is_verified == 1)

    if site.art_form_id:
        related_query = related_query.filter(models.Artwork.art_form_id == site.art_form_id)
    elif site.region:
        related_query = related_query.filter(models.Artwork.region.ilike(f"%{site.region}%"))

    related_query = related_query.group_by(models.Artwork.id).order_by(models.Artwork.created_at.desc())

    related_artworks = []
    for art, h_count in related_query.all():
        art_out = schemas.ArtworkListOut.model_validate(art)
        art_out.hotspot_count = h_count
        related_artworks.append(art_out)

    site_out = schemas.HeritageSiteDetailOut.model_validate(site)
    site_out.related_artworks = related_artworks
    return site_out


# ---------- Community Folklore Contributions ----------

@router.get("/contributions/my", response_model=List[schemas.ContributionOutRich])
def get_my_contributions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Return all contributions submitted by the current user."""
    contributions = (
        db.query(models.Contribution)
        .options(joinedload(models.Contribution.artwork), joinedload(models.Contribution.user))
        .filter(models.Contribution.user_id == current_user.id)
        .order_by(models.Contribution.created_at.desc())
        .all()
    )
    results = []
    for c in contributions:
        item = schemas.ContributionOutRich.model_validate(c)
        item.contributor_name = current_user.name
        item.contributor_is_verified = current_user.is_verified or current_user.role == models.UserRole.ADMIN
        item.artwork_title = c.artwork.title if c.artwork else None
        results.append(item)
    return results


@router.get("/contributions/approved", response_model=List[schemas.ContributionOutRich])
def get_approved_contributions(
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return all approved public community folklore contributions."""
    query = (
        db.query(models.Contribution)
        .options(joinedload(models.Contribution.artwork), joinedload(models.Contribution.user))
        .filter(models.Contribution.status == models.ContributionStatus.APPROVED)
    )
    if category and category != "All":
        query = query.filter(models.Contribution.category == category)

    contributions = query.order_by(models.Contribution.created_at.desc()).all()
    results = []
    for c in contributions:
        item = schemas.ContributionOutRich.model_validate(c)
        item.contributor_name = c.user.name if c.user else "Verified Contributor"
        item.contributor_is_verified = c.user.is_verified if c.user else True
        item.artwork_title = c.artwork.title if c.artwork else None
        results.append(item)
    return results


@router.get("/artworks/{artwork_id}/contributions", response_model=List[schemas.ContributionOutRich])
def get_artwork_contributions(
    artwork_id: int,
    db: Session = Depends(get_db),
):
    """Return approved contributions for a specific artwork."""
    contributions = (
        db.query(models.Contribution)
        .options(joinedload(models.Contribution.user), joinedload(models.Contribution.artwork))
        .filter(
            models.Contribution.artwork_id == artwork_id,
            models.Contribution.status == models.ContributionStatus.APPROVED,
        )
        .order_by(models.Contribution.created_at.desc())
        .all()
    )
    results = []
    for c in contributions:
        item = schemas.ContributionOutRich.model_validate(c)
        item.contributor_name = c.user.name if c.user else "Verified Contributor"
        item.contributor_is_verified = c.user.is_verified if c.user else True
        item.artwork_title = c.artwork.title if c.artwork else None
        results.append(item)
    return results


import os
import uuid
from fastapi import UploadFile, File
from ..config import settings

ALLOWED_IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


@router.post("/contributions/upload-image")
async def upload_contribution_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload an image for a community folklore / tribal history contribution."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported image format '{ext}'. Use JPG, PNG, or WebP.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_name = f"contrib_{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file too large.")

    with open(stored_path, "wb") as f:
        f.write(contents)

    return {"image_url": f"/static/{stored_name}"}


@router.post("/contributions", response_model=schemas.ContributionOut, status_code=201)
def submit_contribution(
    payload: schemas.ContributionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Only verified community contributors (is_verified=True) or admins may
    submit cultural contributions. Unverified users receive a 403.
    """
    if not current_user.is_verified and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail=(
                "Only verified community contributors can submit cultural information. "
                "Please contact the KalaKosh curatorial team to request contributor verification."
            ),
        )

    if payload.artwork_id:
        artwork = db.query(models.Artwork).filter(models.Artwork.id == payload.artwork_id).first()
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found.")

    contribution = models.Contribution(
        user_id=current_user.id,
        artwork_id=payload.artwork_id,
        title=payload.title or "Oral Folklore Narrative",
        category=payload.category or "Regional Folklore",
        region=payload.region,
        content=payload.content,
        image_url=payload.image_url,
        status=models.ContributionStatus.PENDING,
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution

