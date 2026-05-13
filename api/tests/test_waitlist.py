import secrets


def _unique_email():
    return f"test_{secrets.token_hex(6)}@arxify-test.io"


def test_signup_returns_token_and_position(client):
    email = _unique_email()
    r = client.post("/api/waitlist/signup", json={"email": email})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is True
    assert d["position"] >= 1
    assert isinstance(d["token"], str) and len(d["token"]) >= 16


def test_signup_idempotent_returns_same_token(client):
    email = _unique_email()
    r1 = client.post("/api/waitlist/signup", json={"email": email}).json()
    r2 = client.post("/api/waitlist/signup", json={"email": email}).json()
    assert r1["position"] == r2["position"]
    assert r1["token"] == r2["token"]


def test_signup_rejects_invalid_email(client):
    r = client.post("/api/waitlist/signup", json={"email": "not-an-email"})
    assert r.status_code == 400


def test_signup_rejects_too_short(client):
    r = client.post("/api/waitlist/signup", json={"email": "a@b"})
    # pydantic min_length=5 enforces 422; either status is acceptable
    assert r.status_code in (400, 422)


def test_status_returns_account_info(client):
    email = _unique_email()
    signup = client.post(
        "/api/waitlist/signup",
        json={"email": email, "context": "test ctx", "source": "pytest"},
    ).json()
    token = signup["token"]

    r = client.get(f"/api/waitlist/status?token={token}")
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["email"] == email
    assert s["position"] == signup["position"]
    assert s["total"] >= signup["position"]
    assert s["context"] == "test ctx"
    assert s["source"] == "pytest"
    assert s["referred_count"] == 0


def test_status_404_on_bad_token(client):
    r = client.get("/api/waitlist/status?token=garbage_token_xyz")
    assert r.status_code == 404


def test_count_endpoint(client):
    r = client.get("/api/waitlist/count")
    assert r.status_code == 200
    assert isinstance(r.json()["count"], int)
    assert r.json()["count"] >= 1
