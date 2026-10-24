"""Meals & Recipes sync API.

One shared document per household. People sign in with Google; a signed-in
user belongs to at most one household and reads and writes it through
/api/household. The six-character household code is only an invite: entering
it after signing in joins that household. Runs as a Vercel Python function in
production and under uvicorn locally (see README).
"""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Callable

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    from .store import SYNC_KEYS, make_store
except ImportError:  # Vercel loads this file as a top-level module
    from store import SYNC_KEYS, make_store  # type: ignore

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Meals & Recipes API", docs_url=None, redoc_url=None)

# No look-alike characters (0/O, 1/I) so codes are easy to read out loud.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6

# The Google OAuth client for the live site. Not a secret: the page shows it
# to the browser anyway. GOOGLE_CLIENT_ID overrides it (another client, or a
# local one).
DEFAULT_GOOGLE_CLIENT_ID = "203706171519-e35dquq3vrmhm74ah53gk3v06cg6sb8s.apps.googleusercontent.com"

SESSION_COOKIE = "meals_session"
SESSION_DAYS = 90  # phones stay signed in for a season


def new_code() -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


def valid_code(code: str) -> bool:
    return len(code) == CODE_LENGTH and all(c in CODE_ALPHABET for c in code)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@lru_cache(maxsize=1)
def store():
    return make_store()


def google_client_id() -> str:
    return os.environ.get("GOOGLE_CLIENT_ID") or DEFAULT_GOOGLE_CLIENT_ID


def verify_google_credential(credential: str) -> dict:
    """Check the ID token Google's sign-in button hands the page, and return its claims."""
    from google.auth.exceptions import TransportError
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    client_id = google_client_id()
    try:
        claims = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
    except TransportError:
        raise HTTPException(503, "Can't reach Google right now") from None
    except ValueError:
        raise HTTPException(401, "Couldn't verify that sign-in") from None
    if not claims.get("email_verified"):
        raise HTTPException(401, "That Google account's email isn't verified")
    return claims


def google_verifier() -> Callable[[str], dict]:
    """A dependency so tests can swap in a fake verifier."""
    return verify_google_credential


def current_user(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    user = store().session_user(hash_token(token)) if token else None
    if user is None:
        raise HTTPException(401, "Sign in to sync")
    return user


def household_of(user: dict = Depends(current_user)) -> str:
    if not user["household"]:
        raise HTTPException(404, "You're not in a household")
    return user["household"]


class Document(BaseModel):
    """The keys a phone may send. Anything else is ignored."""

    plan: dict | None = None
    routine: dict | None = None
    checked: dict | None = None
    extras: dict | None = None
    recipes: list | None = None
    favorites: list | None = None
    hidden: list | None = None

    def present(self) -> dict:
        return {k: v for k, v in self.model_dump().items() if v is not None and k in SYNC_KEYS}


class Created(BaseModel):
    code: str
    version: str


class SignIn(BaseModel):
    credential: str


class Join(BaseModel):
    code: str


def me_body(user: dict | None) -> dict:
    return {
        "googleClientId": google_client_id(),
        "user": {"email": user["email"], "name": user["name"]} if user else None,
        "household": user["household"] if user else None,
    }


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/me")
def me(request: Request):
    """Who is signed in, their household, and the client id the sign-in button needs."""
    try:
        user = current_user(request)
    except HTTPException:
        user = None
    return me_body(user)


@app.post("/api/auth/google")
def sign_in(body: SignIn, request: Request, response: Response, verify=Depends(google_verifier)):
    claims = verify(body.credential)
    s = store()
    user = s.upsert_user(claims["sub"], claims["email"], claims.get("name"))
    token = secrets.token_urlsafe(32)
    s.create_session(hash_token(token), user["id"], datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS))
    https = request.headers.get("x-forwarded-proto", request.url.scheme) == "https"
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 24 * 3600,
        httponly=True,
        secure=https,
        samesite="lax",
        path="/api",
    )
    return me_body(user)


@app.post("/api/auth/logout")
def sign_out(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        store().delete_session(hash_token(token))
    response.delete_cookie(SESSION_COOKIE, path="/api")
    return {"ok": True}


@app.post("/api/household", response_model=Created, status_code=201)
def create_household(seed: Document = Document(), user: dict = Depends(current_user)):
    """Start a household, seeded with whatever the creating phone already has."""
    s = store()
    for _ in range(10):
        code = new_code()
        if not s.exists(code):
            version = s.create(code, seed.present())
            s.set_household(user["id"], code)
            return Created(code=code, version=version)
    raise HTTPException(500, "Couldn't find a free code, try again")


@app.post("/api/household/join")
def join_household(body: Join, user: dict = Depends(current_user)):
    code = body.code.upper()
    if not valid_code(code):
        raise HTTPException(400, "Codes are 6 letters or digits")
    if not store().exists(code):
        raise HTTPException(404, "No household with that code")
    store().set_household(user["id"], code)
    return {"code": code}


@app.post("/api/household/leave")
def leave_household(user: dict = Depends(current_user)):
    store().set_household(user["id"], None)
    return {"ok": True}


@app.get("/api/household")
def read_household(since: str | None = Query(default=None), code: str = Depends(household_of)):
    """The whole document, or just {changed: false} when `since` matches the current version."""
    found = store().get(code)
    if found is None:
        raise HTTPException(404, "No household with that code")
    data, version = found
    # A "+" in the timestamp arrives as a space when the caller doesn't encode it.
    if since and since.replace(" ", "+") == version:
        return JSONResponse({"changed": False, "version": version})
    return {"changed": True, "version": version, "code": code, "data": {k: data.get(k) for k in SYNC_KEYS}}


@app.patch("/api/household")
def update_household(patch: Document, code: str = Depends(household_of)):
    """Replace the given keys. Keys not sent are left alone."""
    changes = patch.present()
    if not changes:
        raise HTTPException(400, "Nothing to update")
    version = store().merge(code, changes)
    if version is None:
        raise HTTPException(404, "No household with that code")
    return {"version": version}


# Local development: `uvicorn api.index:app --reload --port 8000`
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
