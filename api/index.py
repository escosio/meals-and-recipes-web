"""Meals & Recipes sync API.

One shared document per household, keyed by a short code that both phones
enter once. Runs as a Vercel Python function in production and under uvicorn
locally (see README).
"""

from __future__ import annotations

import os
import secrets
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from .store import SYNC_KEYS, make_store
except ImportError:  # Vercel loads this file as a top-level module
    from store import SYNC_KEYS, make_store  # type: ignore

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Meals & Recipes API", docs_url=None, redoc_url=None)

# No look-alike characters (0/O, 1/I) so codes are easy to read out loud.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def new_code() -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


def valid_code(code: str) -> bool:
    return len(code) == CODE_LENGTH and all(c in CODE_ALPHABET for c in code)


@lru_cache(maxsize=1)
def store():
    return make_store()


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


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/households", response_model=Created, status_code=201)
def create_household(seed: Document = Document()):
    """Start a household, seeded with whatever the creating phone already has."""
    s = store()
    for _ in range(10):
        code = new_code()
        if not s.exists(code):
            return Created(code=code, version=s.create(code, seed.present()))
    raise HTTPException(500, "Couldn't find a free code, try again")


@app.get("/api/households/{code}")
def read_household(code: str, since: str | None = Query(default=None)):
    """The whole document, or just {changed: false} when `since` matches the current version."""
    code = code.upper()
    if not valid_code(code):
        raise HTTPException(400, "Codes are 6 letters or digits")
    found = store().get(code)
    if found is None:
        raise HTTPException(404, "No household with that code")
    data, version = found
    # A "+" in the timestamp arrives as a space when the caller doesn't encode it.
    if since and since.replace(" ", "+") == version:
        return JSONResponse({"changed": False, "version": version})
    return {"changed": True, "version": version, "data": {k: data.get(k) for k in SYNC_KEYS}}


@app.patch("/api/households/{code}")
def update_household(code: str, patch: Document):
    """Replace the given keys. Keys not sent are left alone."""
    code = code.upper()
    if not valid_code(code):
        raise HTTPException(400, "Codes are 6 letters or digits")
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
