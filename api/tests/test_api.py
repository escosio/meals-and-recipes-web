import os

os.environ["MEALS_STORE"] = "memory"

import pytest  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from api.index import app, google_verifier, store  # noqa: E402


def fake_verify(credential: str) -> dict:
    """Credentials in tests are just a name: "alice" signs in as alice@example.com."""
    if credential == "bad":
        raise HTTPException(401, "Couldn't verify that sign-in")
    return {"sub": f"google-{credential}", "email": f"{credential}@example.com", "name": credential.title()}


@pytest.fixture(autouse=True)
def fake_google(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client")
    app.dependency_overrides[google_verifier] = lambda: fake_verify
    store.cache_clear()
    yield
    app.dependency_overrides.clear()


def signed_in(name="alice") -> TestClient:
    c = TestClient(app)
    assert c.post("/api/auth/google", json={"credential": name}).status_code == 200
    return c


def test_health():
    assert TestClient(app).get("/api/health").json() == {"ok": True}


def test_me_signed_out_gives_the_client_id_for_the_button():
    assert TestClient(app).get("/api/me").json() == {"googleClientId": "test-client", "user": None, "household": None}


def test_without_the_setting_the_built_in_client_id_is_used(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLIENT_ID")
    assert TestClient(app).get("/api/me").json()["googleClientId"].endswith(".apps.googleusercontent.com")


def test_sign_in_sets_a_session_cookie_and_sign_out_ends_it():
    c = TestClient(app)
    res = c.post("/api/auth/google", json={"credential": "alice"})
    assert res.json()["user"] == {"email": "alice@example.com", "name": "Alice"}
    cookie = res.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Path=/api" in cookie
    assert c.get("/api/me").json()["user"]["email"] == "alice@example.com"

    c.post("/api/auth/logout")
    assert c.get("/api/me").json()["user"] is None


def test_a_failed_verification_signs_nobody_in():
    c = TestClient(app)
    assert c.post("/api/auth/google", json={"credential": "bad"}).status_code == 401
    assert c.get("/api/me").json()["user"] is None


def test_the_household_needs_a_signed_in_user():
    c = TestClient(app)
    assert c.post("/api/household", json={}).status_code == 401
    assert c.get("/api/household").status_code == 401
    assert c.patch("/api/household", json={"plan": {}}).status_code == 401
    assert c.post("/api/household/join", json={"code": "ABC234"}).status_code == 401


def test_a_signed_in_user_without_a_household_gets_404():
    assert signed_in().get("/api/household").status_code == 404


def test_create_seeds_the_document_and_returns_a_readable_code():
    c = signed_in()
    res = c.post("/api/household", json={"plan": {"2026-10-19": {"Dinner": ["tacos"]}}, "favorites": ["tacos"]})
    assert res.status_code == 201
    body = res.json()
    assert len(body["code"]) == 6
    assert set(body["code"]) <= set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
    assert c.get("/api/me").json()["household"] == body["code"]

    doc = c.get("/api/household").json()
    assert doc["changed"] is True
    assert doc["code"] == body["code"]
    assert doc["version"] == body["version"]
    assert doc["data"]["plan"] == {"2026-10-19": {"Dinner": ["tacos"]}}
    assert doc["data"]["favorites"] == ["tacos"]
    assert doc["data"]["routine"] is None
    assert doc["data"]["hidden"] is None


def test_another_person_joins_with_the_code_and_sees_the_same_document():
    alice = signed_in("alice")
    code = alice.post("/api/household", json={"favorites": ["tacos"]}).json()["code"]

    bob = signed_in("bob")
    assert bob.post("/api/household/join", json={"code": code.lower()}).json() == {"code": code}
    bob.patch("/api/household", json={"favorites": ["tacos", "pernil"]})
    assert alice.get("/api/household").json()["data"]["favorites"] == ["tacos", "pernil"]


def test_joining_checks_the_code():
    c = signed_in()
    assert c.post("/api/household/join", json={"code": "ZZZZZZ"}).status_code == 404
    assert c.post("/api/household/join", json={"code": "short"}).status_code == 400


def test_leaving_stops_access_but_keeps_the_household():
    alice = signed_in("alice")
    code = alice.post("/api/household", json={"favorites": ["x"]}).json()["code"]
    bob = signed_in("bob")
    bob.post("/api/household/join", json={"code": code})

    bob.post("/api/household/leave")
    assert bob.get("/api/household").status_code == 404
    assert alice.get("/api/household").json()["data"]["favorites"] == ["x"]


def test_the_code_alone_no_longer_reads_a_household():
    code = signed_in().post("/api/household", json={"favorites": ["x"]}).json()["code"]
    assert TestClient(app).get(f"/api/households/{code}").status_code in (404, 405)


def test_patch_replaces_only_the_keys_sent():
    c = signed_in()
    c.post("/api/household", json={"plan": {"a": 1}, "favorites": ["x"]})

    assert c.patch("/api/household", json={"plan": {"b": 2}}).status_code == 200
    doc = c.get("/api/household").json()["data"]
    assert doc["plan"] == {"b": 2}, "a deleted day must not come back"
    assert doc["favorites"] == ["x"]


def test_since_skips_unchanged_documents():
    c = signed_in()
    version = c.post("/api/household", json={}).json()["version"]

    assert c.get("/api/household", params={"since": version}).json() == {"changed": False, "version": version}
    # Unencoded "+" in the timestamp still matches.
    assert c.get(f"/api/household?since={version.replace('+', ' ')}").json()["changed"] is False

    newer = c.patch("/api/household", json={"favorites": ["y"]}).json()["version"]
    assert newer != version
    res = c.get("/api/household", params={"since": version}).json()
    assert res["changed"] is True and res["version"] == newer


def test_unknown_keys_are_ignored_and_empty_patches_rejected():
    c = signed_in()
    c.post("/api/household", json={"plan": {}, "password": "nope"})
    assert "password" not in c.get("/api/household").json()["data"]
    assert c.patch("/api/household", json={"password": "nope"}).status_code == 400
