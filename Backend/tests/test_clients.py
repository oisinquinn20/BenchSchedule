from bson import ObjectId


def _client_payload(**overrides):
    base = {
        "name": "TestMe Ltd",
        "phone": "123456789",
        "email": "test@me.com",
        "address": "123 Test Street",
        "description": "Test client",
    }
    base.update(overrides)
    return base


def test_clients_requires_auth(client):
    r = client.get("/api/v1.0/clients")
    assert r.status_code == 401


def test_create_client_admin_only(client, user_auth_header):
    r = client.post(
        "/api/v1.0/clients",
        json=_client_payload(),
        headers=user_auth_header,
    )
    assert r.status_code == 401


def test_create_client_success(client, auth_header):
    r = client.post(
        "/api/v1.0/clients",
        json=_client_payload(),
        headers=auth_header,
    )
    assert r.status_code == 201
    assert r.get_json()["name"] == "TestMe Ltd"


def test_create_client_invalid_phone(client, auth_header):
    r = client.post(
        "/api/v1.0/clients",
        json=_client_payload(phone="abc"),
        headers=auth_header,
    )
    assert r.status_code == 400
    assert "phone" in r.get_json()["message"].lower()


def test_list_clients(client, auth_header):
    created = client.post("/api/v1.0/clients", json=_client_payload(), headers=auth_header).get_json()

    r = client.get("/api/v1.0/clients", headers=auth_header)
    assert r.status_code == 200
    ids = [c["id"] for c in r.get_json()]
    assert created["id"] in ids


def test_get_client_by_id(client, auth_header):
    create = client.post(
        "/api/v1.0/clients",
        json=_client_payload(),
        headers=auth_header,
    )
    cid = create.get_json()["id"]

    r = client.get(f"/api/v1.0/clients/{cid}", headers=auth_header)
    assert r.status_code == 200
    assert r.get_json()["id"] == cid


def test_update_client(client, auth_header):
    create = client.post(
        "/api/v1.0/clients",
        json=_client_payload(),
        headers=auth_header,
    )
    cid = create.get_json()["id"]

    r = client.put(
        f"/api/v1.0/clients/{cid}",
        json={"name": "Updated Name"},
        headers=auth_header,
    )
    assert r.status_code == 200
    assert r.get_json()["name"] == "Updated Name"


def test_delete_client(client, auth_header):
    create = client.post(
        "/api/v1.0/clients",
        json=_client_payload(),
        headers=auth_header,
    )
    cid = create.get_json()["id"]

    r = client.delete(f"/api/v1.0/clients/{cid}", headers=auth_header)
    assert r.status_code == 200