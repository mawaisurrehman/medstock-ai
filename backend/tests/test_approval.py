"""Tests for recommendation approval workflow."""


def test_approve_recommendation(client, auth_headers):
    resp = client.post("/api/recommendations/rec-1/approve", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "APPROVED"


def test_reject_recommendation(client, auth_headers):
    resp = client.post(
        "/api/recommendations/rec-2/reject",
        headers=auth_headers,
        json={"reason": "Not needed at this time"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "REJECTED"


def test_approve_nonexistent(client, auth_headers):
    resp = client.post("/api/recommendations/rec-999/approve", headers=auth_headers)
    assert resp.status_code == 404
