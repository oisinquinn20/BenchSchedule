import base64

def _basic(username, password):
    b64 = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {b64}"}


def test_login_requires_auth(client):
    r = client.get("/api/v1.0/login")
    assert r.status_code == 401
    assert r.get_json()["message"] == "Authentication required"


def test_login_invalid_username(client):
    r = client.get("/api/v1.0/login", headers=_basic("nope", "x"))
    assert r.status_code == 401
    assert r.get_json()["message"] == "Invalid username"


def test_login_invalid_password(client):
    r = client.get("/api/v1.0/login", headers=_basic("admin", "wrong"))
    assert r.status_code == 401
    assert r.get_json()["message"] == "Invalid password"


def test_login_success_returns_token(client):
    r = client.get("/api/v1.0/login", headers=_basic("admin", "admin123"))
    assert r.status_code == 200
    data = r.get_json()
    assert "token" in data
    assert isinstance(data["token"], str)


def test_logout_blacklists_token(client, auth_header):
    # first logout should work
    r1 = client.get("/api/v1.0/logout", headers=auth_header)
    assert r1.status_code == 200
    assert r1.get_json()["message"] == "Logout successful"

    # second logout should fail because jwt_required blocks blacklisted token
    r2 = client.get("/api/v1.0/logout", headers=auth_header)
    assert r2.status_code == 401
    assert r2.get_json()["message"] == "Token has been cancelled"

def test_register_success(client):
    r = client.post(
        "/api/v1.0/register",
        json={"username": "newuser", "password": "pass123"},
    )
    assert r.status_code == 201
    assert r.get_json()["message"] == "User registered successfully"


def test_register_duplicate_username(client):
    # admin already exists from conftest seed
    r = client.post(
        "/api/v1.0/register",
        json={"username": "admin", "password": "pass123"},
    )
    assert r.status_code == 409
    assert r.get_json()["message"] == "Username already exists"


def test_register_missing_fields(client):
    r = client.post("/api/v1.0/register", json={"username": "x"})
    assert r.status_code == 400
    assert "required" in r.get_json()["message"].lower()