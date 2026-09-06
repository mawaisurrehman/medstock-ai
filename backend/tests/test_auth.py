"""Tests for authentication API."""


def test_login_success(client):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "ADMIN"


def test_login_invalid_email(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "testpass123"})
    assert resp.status_code == 401


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert resp.status_code == 401


def test_protected_route_without_token(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 401


def test_protected_route_with_invalid_token(client):
    resp = client.get("/api/dashboard", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


def test_me_endpoint(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"


def test_dashboard_with_auth(client, auth_headers):
    resp = client.get("/api/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "totalMedicines" in data
