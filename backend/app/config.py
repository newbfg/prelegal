import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Fresh SQLite file recreated on every startup - see app/db.py:init_db.
DB_PATH = Path(os.environ.get("DATABASE_PATH", str(BASE_DIR / "data" / "app.db")))

# Static frontend export, produced by `next build` and copied in by the Dockerfile.
STATIC_DIR = Path(os.environ.get("STATIC_DIR", str(BASE_DIR / "static")))

# No persisted secret required yet: a new random key each process start is fine
# since sessions aren't expected to survive a container restart at this stage.
JWT_SECRET = os.environ.get("JWT_SECRET") or secrets.token_hex(32)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))

AUTH_COOKIE_NAME = "prelegal_session"
