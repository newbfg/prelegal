def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_creates_user_and_session(client):
    response = client.post(
        "/api/auth/signup",
        json={"email": "alice@example.com", "password": "correct-horse"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "id" in body
    assert "prelegal_session" in response.cookies

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "alice@example.com"


def test_signup_rejects_duplicate_email(client):
    payload = {"email": "bob@example.com", "password": "correct-horse"}
    first = client.post("/api/auth/signup", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/signup", json=payload)
    assert second.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post(
        "/api/auth/signup", json={"email": "short@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_signin_with_correct_credentials(client):
    client.post(
        "/api/auth/signup",
        json={"email": "carol@example.com", "password": "correct-horse"},
    )
    client.cookies.clear()

    response = client.post(
        "/api/auth/signin",
        json={"email": "carol@example.com", "password": "correct-horse"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "carol@example.com"


def test_signin_with_wrong_password(client):
    client.post(
        "/api/auth/signup",
        json={"email": "dave@example.com", "password": "correct-horse"},
    )
    client.cookies.clear()

    response = client.post(
        "/api/auth/signin",
        json={"email": "dave@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_signin_with_unknown_email(client):
    response = client.post(
        "/api/auth/signin",
        json={"email": "nobody@example.com", "password": "whatever1"},
    )
    assert response.status_code == 401


def test_me_without_session_is_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_signout_clears_session(client):
    client.post(
        "/api/auth/signup",
        json={"email": "erin@example.com", "password": "correct-horse"},
    )

    signout = client.post("/api/auth/signout")
    assert signout.status_code == 204

    me = client.get("/api/auth/me")
    assert me.status_code == 401
