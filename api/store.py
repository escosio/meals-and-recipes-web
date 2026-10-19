"""Storage for household documents.

A household is one JSON document holding the keys the app syncs. Writes merge
top-level keys (last write wins per key) and bump a version string the client
uses to skip unchanged polls.

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


def make_store():
    if os.environ.get("MEALS_STORE") == "memory":
        return MemoryStore()
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set. Put it in .env locally and in Vercel's environment variables.")
    return PostgresStore(dsn)
