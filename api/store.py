"""Storage for household documents, users and sessions.

A household is one JSON document holding the keys the app syncs. Writes merge
top-level keys (last write wins per key) and bump a version string the client
uses to skip unchanged polls.

A user is a Google account (id is Google's `sub`) and belongs to at most one
household. Sessions are stored by the SHA-256 of their cookie token.

PostgresStore is used in production (Neon). MemoryStore backs the tests and
can be forced locally with MEALS_STORE=memory.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

SYNC_KEYS = ("plan", "routine", "checked", "extras", "recipes", "favorites", "hidden")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="microseconds")


class MemoryStore:
    def __init__(self) -> None:
        self._docs: dict[str, dict] = {}
        self._versions: dict[str, str] = {}
        self._users: dict[str, dict] = {}
        self._sessions: dict[str, tuple[str, datetime]] = {}

    def create(self, code: str, data: dict) -> str:
        self._docs[code] = {k: data.get(k) for k in SYNC_KEYS if k in data}
        self._versions[code] = _now()
        return self._versions[code]

    def exists(self, code: str) -> bool:
        return code in self._docs

    def get(self, code: str) -> tuple[dict, str] | None:
        if code not in self._docs:
            return None
        return self._docs[code], self._versions[code]

    def merge(self, code: str, patch: dict) -> str | None:
        if code not in self._docs:
            return None
        self._docs[code].update(patch)
        self._versions[code] = _now()
        return self._versions[code]

    def upsert_user(self, user_id: str, email: str, name: str | None) -> dict:
        user = self._users.setdefault(user_id, {"id": user_id, "household": None})
        user.update(email=email, name=name)
        return dict(user)

    def set_household(self, user_id: str, code: str | None) -> None:
        self._users[user_id]["household"] = code

    def create_session(self, token_hash: str, user_id: str, expires_at: datetime) -> None:
        self._sessions[token_hash] = (user_id, expires_at)

    def session_user(self, token_hash: str) -> dict | None:
        found = self._sessions.get(token_hash)
        if found is None or found[1] <= datetime.now(timezone.utc):
            return None
        return dict(self._users[found[0]])

    def delete_session(self, token_hash: str) -> None:
        self._sessions.pop(token_hash, None)


class PostgresStore:
    def __init__(self, dsn: str) -> None:
        import psycopg

        self._psycopg = psycopg
        self._dsn = dsn
        self._ensure_table()

    def _connect(self):
        return self._psycopg.connect(self._dsn, autocommit=True)

    def _ensure_table(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS households (
                  code        text PRIMARY KEY,
                  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
                  created_at  timestamptz NOT NULL DEFAULT now(),
                  updated_at  timestamptz NOT NULL DEFAULT now()
                );
                CREATE TABLE IF NOT EXISTS users (
                  id          text PRIMARY KEY,
                  email       text NOT NULL,
                  name        text,
                  household   text REFERENCES households (code) ON DELETE SET NULL,
                  created_at  timestamptz NOT NULL DEFAULT now()
                );
                CREATE TABLE IF NOT EXISTS sessions (
                  token_hash  text PRIMARY KEY,
                  user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                  expires_at  timestamptz NOT NULL
                )
                """
            )

    def create(self, code: str, data: dict) -> str:
        doc = {k: data.get(k) for k in SYNC_KEYS if k in data}
        with self._connect() as conn:
            row = conn.execute(
                "INSERT INTO households (code, data) VALUES (%s, %s::jsonb) RETURNING updated_at",
                (code, json.dumps(doc)),
            ).fetchone()
        return row[0].isoformat(timespec="microseconds")

    def exists(self, code: str) -> bool:
        with self._connect() as conn:
            return conn.execute("SELECT 1 FROM households WHERE code = %s", (code,)).fetchone() is not None

    def get(self, code: str) -> tuple[dict, str] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT data, updated_at FROM households WHERE code = %s", (code,)).fetchone()
        if row is None:
            return None
        return row[0], row[1].isoformat(timespec="microseconds")

    def merge(self, code: str, patch: dict) -> str | None:
        # jsonb || replaces each top-level key outright, so deleted days go away too.
        with self._connect() as conn:
            row = conn.execute(
                """
                UPDATE households
                   SET data = data || %s::jsonb, updated_at = clock_timestamp()
                 WHERE code = %s
                RETURNING updated_at
                """,
                (json.dumps(patch), code),
            ).fetchone()
        return None if row is None else row[0].isoformat(timespec="microseconds")

    def upsert_user(self, user_id: str, email: str, name: str | None) -> dict:
        with self._connect() as conn:
            row = conn.execute(
                """
                INSERT INTO users (id, email, name) VALUES (%s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
                RETURNING id, email, name, household
                """,
                (user_id, email, name),
            ).fetchone()
        return dict(zip(("id", "email", "name", "household"), row))

    def set_household(self, user_id: str, code: str | None) -> None:
        with self._connect() as conn:
            conn.execute("UPDATE users SET household = %s WHERE id = %s", (code, user_id))

    def create_session(self, token_hash: str, user_id: str, expires_at: datetime) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM sessions WHERE expires_at < now()")
            conn.execute(
                "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (%s, %s, %s)",
                (token_hash, user_id, expires_at),
            )

    def session_user(self, token_hash: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT u.id, u.email, u.name, u.household
                  FROM sessions s JOIN users u ON u.id = s.user_id
                 WHERE s.token_hash = %s AND s.expires_at > now()
                """,
                (token_hash,),
            ).fetchone()
        return None if row is None else dict(zip(("id", "email", "name", "household"), row))

    def delete_session(self, token_hash: str) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM sessions WHERE token_hash = %s", (token_hash,))


def make_store():
    if os.environ.get("MEALS_STORE") == "memory":
        return MemoryStore()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set. Put it in .env locally and in Vercel's environment variables.")
    return PostgresStore(dsn)
