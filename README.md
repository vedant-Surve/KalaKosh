# KalaKosh — Living Archive of Indigenous Art

A zero-install, web-based cultural heritage platform showcasing Warli Art (and
extensible to other Indian indigenous art forms) with interactive SVG
hotspots, oral storytelling, native audio narration, and a full curatorial
admin deck — backed by a real MySQL database (no mock/dummy data).

```
kalakosh/
├── backend/    FastAPI + SQLAlchemy + MySQL
└── frontend/   React (Vite) + Tailwind CSS
```

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your real MySQL credentials
```

Create the database (once):

```sql
CREATE DATABASE kalakosh_db CHARACTER SET utf8mb4;
```

Seed the initial Warli Art content (Tree of Life, Dance Circle, The Sun) and
the default admin account:

```bash
python -m app.seed
```

This prints the admin login — by default `admin@kalakosh.org` /
`ChangeMe!123`. **Change this password immediately in production.**

The seed also references placeholder image/audio filenames
(`sample-warli-artwork.jpg`, `sample-tree-of-life-en.mp3`, etc.) as pointers
— drop real files with those names into the `uploads/` folder (created
automatically), or replace the `image_url` / re-upload audio via the admin
Hotspot Mapper once the app is running.

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs (local): http://localhost:8000/docs
Production Backend: https://kalakosh-2.onrender.com

## 2. Frontend setup

```bash
cd frontend
npm install

cp .env.example .env
# configured to https://kalakosh-2.onrender.com by default
```

Run the dev server:

```bash
npm run dev
```

Visit http://localhost:5173

## 3. Using the platform

- **Public gallery** (`/`) — browse art forms and verified artworks, sourced
  live from `GET /art-forms` and `GET /artworks`.
- **Artwork detail** (`/artworks/:id`) — interactive SVG hotspot canvas,
  motif pill navigation, symbolism/folklore panel, and native audio
  narration player.
- **Register / Login** — JWT-based auth (`/register`, `/login`). New
  accounts get the `User` role.
- **Admin Curatorial Deck** (`/admin`, admin role only) — live CMS metrics,
  art form / artwork creation, and contribution moderation.
- **Visual Hotspot Mapper** (`/admin/hotspot-mapper`) — select an artwork,
  click on the canvas to drop a pin (live `X: %, Y: %` readout), fill in
  symbol name / cultural meaning / folklore, optionally attach a narration
  audio file, and save — this performs three real database writes
  (`hotspots`, `stories`, `audio_files`) via the FastAPI backend.

To promote a registered user to Admin, update their role directly in MySQL:

```sql
UPDATE users SET role = 'Admin' WHERE email = 'someone@example.com';
```

## 4. API surface

| Method | Path                                   | Auth        |
|--------|-----------------------------------------|-------------|
| POST   | /auth/register                          | Public      |
| POST   | /auth/login                             | Public      |
| GET    | /auth/me                                | User        |
| GET    | /art-forms                              | Public      |
| GET    | /artworks                               | Public      |
| GET    | /artworks/{id}                          | Public      |
| POST   | /contributions                          | User        |
| GET    | /admin/metrics                          | Admin       |
| POST   | /admin/art-forms                        | Admin       |
| POST   | /admin/artworks                         | Admin       |
| POST   | /admin/hotspots                         | Admin       |
| DELETE | /admin/hotspots/{id}                    | Admin       |
| POST   | /admin/stories                          | Admin       |
| POST   | /admin/audio (multipart)                | Admin       |
| GET    | /admin/contributions                    | Admin       |
| PUT    | /admin/contributions/{id}/approve       | Admin       |
| PUT    | /admin/contributions/{id}/reject        | Admin       |

## 5. Notes on production hardening

- Schema changes should move to Alembic migrations instead of
  `Base.metadata.create_all`.
- Set a strong, random `JWT_SECRET_KEY` and shorten
  `ACCESS_TOKEN_EXPIRE_MINUTES` for production.
- Swap local `uploads/` storage for S3 / cloud object storage if deploying
  beyond a single server.
- Add rate limiting to `/auth/login` and `/contributions`.
