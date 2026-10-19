import os

os.environ["MEALS_STORE"] = "memory"

from fastapi.testclient import TestClient  # noqa: E402

from api.index import app, store  # noqa: E402


def client():
    store.cache_clear()
    return TestClient(app)


def test_health():
    assert client().get("/api/health").json() == {"ok": True}


def test_create_seeds_the_document_and_returns_a_readable_code():
    c = client()
    res = c.post("/api/households", json={"plan": {"2026-10-19": {"Dinner": ["tacos"]}}, "favorites": ["tacos"]})
    assert res.status_code == 201
    body = res.json()
    assert len(body["code"]) == 6
    assert set(body["code"]) <= set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

    doc = c.get(f"/api/households/{body['code']}").json()
    assert doc["changed"] is True
    assert doc["version"] == body["version"]
    assert doc["data"]["plan"] == {"2026-10-19": {"Dinner": ["tacos"]}}
    assert doc["data"]["favorites"] == ["tacos"]
    assert doc["data"]["routine"] is None


def test_patch_replaces_only_the_keys_sent():
    c = client()
    code = c.post("/api/households", json={"plan": {"a": 1}, "favorites": ["x"]}).json()["code"]

    res = c.patch(f"/api/households/{code}", json={"plan": {"b": 2}})
    assert res.status_code == 200
    doc = c.get(f"/api/households/{code}").json()["data"]
    assert doc["plan"] == {"b": 2}, "a deleted day must not come back"
    assert doc["favorites"] == ["x"]


def test_since_skips_unchanged_documents():
    c = client()
    created = c.post("/api/households", json={}).json()
    code, version = created["code"], created["version"]

    assert c.get(f"/api/households/{code}", params={"since": version}).json() == {"changed": False, "version": version}
    # Unencoded "+" in the timestamp still matches.
    assert c.get(f"/api/households/{code}?since={version.replace('+', ' ')}").json()["changed"] is False

    newer = c.patch(f"/api/households/{code}", json={"favorites": ["y"]}).json()["version"]
    assert newer != version
    res = c.get(f"/api/households/{code}", params={"since": version}).json()
    assert res["changed"] is True and res["version"] == newer


def test_codes_are_case_insensitive_and_validated():
    c = client()
    code = c.post("/api/households", json={}).json()["code"]
    assert c.get(f"/api/households/{code.lower()}").status_code == 200
    assert c.get("/api/households/ZZZZZZ").status_code == 404
    assert c.get("/api/households/short").status_code == 400
    assert c.patch("/api/households/ZZZZZZ", json={"plan": {}}).status_code == 404


def test_unknown_keys_are_ignored_and_empty_patches_rejected():
    c = client()
    code = c.post("/api/households", json={"plan": {}, "password": "nope"}).json()["code"]
    assert "password" not in c.get(f"/api/households/{code}").json()["data"]
    assert c.patch(f"/api/households/{code}", json={"password": "nope"}).status_code == 400
