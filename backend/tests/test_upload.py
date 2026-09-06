"""Tests for CSV/XLSX upload."""
import io


def test_upload_valid_csv(client, auth_headers):
    csv_content = "medicine_name,quantity,batch_number,expiry_date\nParacetamol,500,PAR-001,2027-12-31\n"
    files_upload = {"file": ("inventory.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    resp = client.post("/api/uploads/inventory", headers=auth_headers, files=files_upload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_upload_invalid_file_type(client, auth_headers):
    files_upload = {"file": ("inventory.exe", io.BytesIO(b"not a csv"), "application/octet-stream")}
    resp = client.post("/api/uploads/inventory", headers=auth_headers, files=files_upload)
    assert resp.status_code == 400


def test_upload_no_file(client, auth_headers):
    resp = client.post("/api/uploads/inventory", headers=auth_headers)
    assert resp.status_code == 422
