"""Tests for the medicines API — list, detail, and id parsing."""


def test_list_medicines(client, auth_headers):
    resp = client.get("/api/medicines", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) >= 2
    # Ids are exposed to the frontend in the ``med-<n>`` form.
    assert all(m["id"].startswith("med-") for m in items)


def test_get_medicine_by_prefixed_id(client, auth_headers):
    """Regression: GET /api/medicines/med-1 must not 500 on the ``med-`` prefix."""
    listed = client.get("/api/medicines", headers=auth_headers).json()
    med_id = listed[0]["id"]  # e.g. "med-1"

    resp = client.get(f"/api/medicines/{med_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == med_id


def test_get_medicine_unknown_id_returns_404(client, auth_headers):
    assert client.get("/api/medicines/med-9999", headers=auth_headers).status_code == 404


def test_get_medicine_garbage_id_returns_404_not_500(client, auth_headers):
    assert client.get("/api/medicines/not-a-number", headers=auth_headers).status_code == 404


def test_get_medicine_requires_auth(client):
    assert client.get("/api/medicines/med-1").status_code == 401
