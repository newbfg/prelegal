import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from .. import db
from ..config import AUTH_COOKIE_NAME, JWT_EXPIRE_MINUTES
from ..schemas import SigninRequest, SignupRequest, UserOut
from ..security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_MAX_AGE = JWT_EXPIRE_MINUTES * 60


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        path="/",
    )


def get_current_user(request: Request) -> UserOut:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    user_id = decode_access_token(token) if token else None
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    conn = db.get_connection()
    try:
        row = conn.execute(
            "SELECT id, email FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return UserOut(id=row["id"], email=row["email"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response) -> UserOut:
    conn = db.get_connection()
    try:
        # Rely on the UNIQUE constraint rather than a check-then-insert, which
        # would be a TOCTOU race between two concurrent signups for the same
        # email (FastAPI runs sync routes like this one in a thread pool).
        try:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (payload.email, hash_password(payload.password)),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
        conn.commit()
        user_id = cursor.lastrowid
    finally:
        conn.close()

    _set_session_cookie(response, create_access_token(user_id))
    return UserOut(id=user_id, email=payload.email)


@router.post("/signin", response_model=UserOut)
def signin(payload: SigninRequest, response: Response) -> UserOut:
    conn = db.get_connection()
    try:
        row = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            (payload.email,),
        ).fetchone()
    finally:
        conn.close()

    if row is None or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    _set_session_cookie(response, create_access_token(row["id"]))
    return UserOut(id=row["id"], email=row["email"])


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def signout(response: Response) -> None:
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user
