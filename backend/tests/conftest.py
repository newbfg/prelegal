import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A TestClient wired to a fresh, isolated SQLite file per test.

    Env vars must be set before app.config/app.db are imported, so each test
    reloads both modules (and the routers that hold a reference to app.db)
    after pointing DATABASE_PATH at a per-test tmp file.
    """
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("STATIC_DIR", str(tmp_path / "static-missing"))

    from app import config, db
    from app.routers import auth
    from app import main

    importlib.reload(config)
    importlib.reload(db)
    importlib.reload(auth)
    importlib.reload(main)

    with TestClient(main.app) as test_client:
        yield test_client
