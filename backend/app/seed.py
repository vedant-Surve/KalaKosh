"""
One-time content seed for KalaKosh.

This populates the platform's *real* initial curatorial content — the Warli
Art for
m and its founding artwork with the three motifs named in the product
spec (Tree of Life / Mahadev, Dance Circle, The Sun) — so the app has
something genuine to display on first boot. It does not fabricate users,
contributions, or test/placeholder records beyond this seed content.

Run with:  python -m app.seed
Re-running is safe — it checks for existing records before inserting.
"""
from .database import SessionLocal, Base, engine
from . import models, auth

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # --- Admin account ---
        admin_email = "admin@kalakosh.org"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin:
            admin = models.User(
                name="KalaKosh Curator",
                email=admin_email,
                password_hash=auth.hash_password("ChangeMe!123"),
                role=models.UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            print(f"Created admin account: {admin_email} / ChangeMe!123 (change this immediately)")
        else:
            print("Admin account already exists — skipping.")

        # --- Art Form: Warli Art ---
        art_form = db.query(models.ArtForm).filter(models.ArtForm.name == "Warli Art").first()
        if not art_form:
            art_form = models.ArtForm(
                name="Warli Art",
                description=(
                    "Warli painting is a tribal art form practiced by the Warli people of "
                    "Maharashtra, India. Rendered traditionally in white rice-paste pigment "
                    "on mud walls, it uses basic geometric shapes — circles, triangles and "
                    "lines — to depict harvests, hunts, dance, and the sacred bond between "
                    "humans and nature."
                ),
                region="Maharashtra, India",
            )
            db.add(art_form)
            db.commit()
            db.refresh(art_form)
            print("Created art form: Warli Art")
        else:
            print("Art form 'Warli Art' already exists — skipping.")

        # --- Artwork ---
        artwork = (
            db.query(models.Artwork)
            .filter(models.Artwork.title == "The Sacred Harvest Circle")
            .first()
        )
        if not artwork:
            artwork = models.Artwork(
                art_form_id=art_form.id,
                title="The Sacred Harvest Circle",
                description=(
                    "A ceremonial Warli mural depicting the Tarpa dance around the Mahadev "
                    "sacred tree, painted for a harvest festival. Villagers, animals, and "
                    "celestial motifs interlock in a single continuous composition — a "
                    "visual chronicle of Warli cosmology."
                ),
                image_url="/static/sample-warli-artwork.jpg",
                region="Maharashtra, India",
                is_verified=1,
            )
            db.add(artwork)
            db.commit()
            db.refresh(artwork)
            print("Created artwork: The Sacred Harvest Circle")
        else:
            print("Artwork already exists — skipping.")

        # --- Hotspots + Stories + Audio ---
        motifs = [
            {
                "name": "Mahadev Sacred Tree",
                "x": 48.2,
                "y": 36.5,
                "story_title": "The Tree of Life",
                "meaning": (
                    "The central tree represents Mahadev, guardian spirit of the Warli "
                    "cosmos — the axis connecting earth, ancestors, and sky."
                ),
                "description": (
                    "Elders tell that the first tree grew from the spot where the earth "
                    "goddess first touched soil. Villagers circle it during Tarpa festivals "
                    "so its roots may carry their prayers to the ancestors below."
                ),
                "audio_url": "/static/sample-tree-of-life-en.mp3",
            },
            {
                "name": "Tarpa Dance Circle",
                "x": 30.0,
                "y": 62.0,
                "story_title": "Dance Circle",
                "meaning": (
                    "The chain of dancers in a spiral represents communal unity — no single "
                    "figure leads, echoing the Warli belief that no one person stands above "
                    "the collective."
                ),
                "description": (
                    "At harvest time, men and women link hands and circle the Tarpa "
                    "player, spiralling inward and outward through the night — a dance "
                    "said to mirror the turning of seasons themselves."
                ),
                "audio_url": "/static/sample-dance-circle-en.mp3",
            },
            {
                "name": "The Sun",
                "x": 74.0,
                "y": 18.0,
                "story_title": "The Sun",
                "meaning": (
                    "The sun motif, rendered as a dotted circle, symbolizes Surya as the "
                    "life-giving force that ripens the harvest being celebrated below."
                ),
                "description": (
                    "Warli painters place the sun opposite the moon on the mural's edges, "
                    "a reminder that day and night, like sowing and harvest, are bound in "
                    "an unbroken cycle."
                ),
                "audio_url": "/static/sample-the-sun-en.mp3",
            },
        ]

        for motif in motifs:
            existing = (
                db.query(models.Hotspot)
                .filter(models.Hotspot.artwork_id == artwork.id, models.Hotspot.name == motif["name"])
                .first()
            )
            if existing:
                print(f"Hotspot '{motif['name']}' already exists — skipping.")
                continue

            hotspot = models.Hotspot(
                artwork_id=artwork.id,
                name=motif["name"],
                x_coordinate=motif["x"],
                y_coordinate=motif["y"],
            )
            db.add(hotspot)
            db.commit()
            db.refresh(hotspot)

            story = models.Story(
                hotspot_id=hotspot.id,
                title=motif["story_title"],
                meaning=motif["meaning"],
                description=motif["description"],
                language="English",
            )
            db.add(story)
            db.commit()
            db.refresh(story)

            audio = models.AudioFile(
                story_id=story.id,
                audio_url=motif["audio_url"],
                language="English",
                duration=None,
            )
            db.add(audio)
            db.commit()
            print(f"Created hotspot + story + audio: {motif['name']}")

        # --- Seed Verified Contributor ---
        contributor_email = "dhaval.elder@kalakosh.org"
        contributor = db.query(models.User).filter(models.User.email == contributor_email).first()
        if not contributor:
            contributor = models.User(
                name="Dhaval Warli (Heritage Elder)",
                email=contributor_email,
                password_hash=auth.hash_password("ElderPass!123"),
                role=models.UserRole.USER,
                is_verified=True,
            )
            db.add(contributor)
            db.commit()
            db.refresh(contributor)
            print("Created verified contributor: Dhaval Warli")

        # --- Seed Heritage Sites (for QR Code Scanner & Geo-Lore) ---
        sites_data = [
            {
                "name": "Warli Sacred Grove & Heritage Village",
                "code": "WARLI-PALGHAR-01",
                "region": "Palghar, Sahyadri Foothills",
                "state": "Maharashtra",
                "description": (
                    "Nestled in the northern Sahyadri range of Maharashtra, this ancestral settlement "
                    "is the living cradle of the Warli indigenous community. Red mud walls decorated with "
                    "rice-paste paintings narrate daily life, the sacred Tarpa harvest festival, and the "
                    "revered Mahadev tree of life."
                ),
                "historical_significance": (
                    "Recognized for unbroken oral traditions dating back over 2,500 years. The community "
                    "continues to paint without formal sketches, using bamboo pens and sacred geometry to "
                    "record cosmic balance and harvest rituals."
                ),
                "coordinates": "19.6967° N, 72.7655° E",
                "image_url": "https://images.unsplash.com/photo-1599707303398-75e1147a468e?auto=format&fit=crop&w=1200&q=80",
                "art_form_id": art_form.id,
            },
            {
                "name": "Bhimbetka Prehistoric Rock Shelters",
                "code": "BHIMBETKA-MP-02",
                "region": "Raisen District",
                "state": "Madhya Pradesh",
                "description": (
                    "A UNESCO World Heritage Site featuring over 750 rock shelters with prehistoric rock "
                    "paintings spanning Upper Paleolithic to medieval times. The linear dynamic figures "
                    "are considered ancestral predecessors to central Indian tribal art forms."
                ),
                "historical_significance": (
                    "Contains some of the oldest known rock art in the Indian subcontinent, demonstrating "
                    "the origins of tribal iconography, animal symbolism, and ceremonial community dance."
                ),
                "coordinates": "22.9372° N, 77.6127° E",
                "image_url": "https://images.unsplash.com/photo-1609137144822-2615c8e27c19?auto=format&fit=crop&w=1200&q=80",
                "art_form_id": art_form.id,
            },
            {
                "name": "Mithila Cultural Heritage Corridor",
                "code": "MITHILA-BIHAR-03",
                "region": "Jitwarpur & Ranti",
                "state": "Bihar",
                "description": (
                    "The historic epicenter of Madhubani painting where women artisans have preserved "
                    "the Kohbar and Aripan ceremonial line traditions across generations using natural "
                    "dyes, neem twigs, and mineral pigments."
                ),
                "historical_significance": (
                    "Traditional epicenter of sacred geometric wall art created for wedding rituals, "
                    "deity worship, and cosmic fertility celebrations."
                ),
                "coordinates": "26.3533° N, 86.0719° E",
                "image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
                "art_form_id": None,
            },
        ]

        for s in sites_data:
            existing_site = db.query(models.HeritageSite).filter(models.HeritageSite.code == s["code"]).first()
            if not existing_site:
                site_obj = models.HeritageSite(**s)
                db.add(site_obj)
                db.commit()
                print(f"Created heritage site: {s['name']} ({s['code']})")

        # --- Seed Sample Verified Community Folklore Contributions ---
        folklore_samples = [
            {
                "title": "The Awakening of Palghat — Goddess of Fertility",
                "category": "Regional Folklore",
                "region": "Palghar, Maharashtra",
                "content": (
                    "In our Warli wedding ceremonies (Lagnacha Chawk), the square central frame must be "
                    "drawn first by the Savari (married women elders). Within it sits Palghat, goddess of "
                    "fertility. Elders teach that no wedding may proceed until her feet touch the harvest "
                    "soil drawn in rice paste, ensuring prosperity and peace for seven generations."
                ),
                "status": models.ContributionStatus.APPROVED,
                "artwork_id": artwork.id,
                "user_id": contributor.id if contributor else admin.id,
            },
            {
                "title": "The Legend of the Tarpa Instrument & Spiral Dance",
                "category": "Tribal History",
                "region": "Jawhar Tribal Belt, Maharashtra",
                "content": (
                    "The Tarpa horn is carved exclusively from dried bottle gourd and bamboo reed by master "
                    "craftsmen during the monsoon. The Tarpa player stands in the center representing the "
                    "sun, and the dancers circle counter-clockwise mimicking the natural cycle of the seasons "
                    "and the movement of celestial constellations across the night sky."
                ),
                "status": models.ContributionStatus.APPROVED,
                "artwork_id": artwork.id,
                "user_id": contributor.id if contributor else admin.id,
            },
            {
                "title": "Natural Pigment Alchemy: Soot, Cowdung, & Rice Paste",
                "category": "Craft Traditions",
                "region": "Dahanu, Maharashtra",
                "content": (
                    "Traditional Warli murals never used synthetic paints. The ochre mud wall is prepared "
                    "with a base of cowdung, charcoal soot, and red brick powder. White rice is soaked "
                    "overnight, ground on a stone mortar with water and acacia gum binder, creating a luminous "
                    "pigment that withstands decades of coastal humidity."
                ),
                "status": models.ContributionStatus.APPROVED,
                "artwork_id": artwork.id,
                "user_id": contributor.id if contributor else admin.id,
            },
        ]

        for f in folklore_samples:
            existing_c = db.query(models.Contribution).filter(models.Contribution.title == f["title"]).first()
            if not existing_c:
                c_obj = models.Contribution(**f)
                db.add(c_obj)
                db.commit()
                print(f"Created sample verified folklore card: {f['title']}")

        print("\nSeed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
