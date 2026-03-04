import sys
import importlib
from pathlib import Path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import pytest
import mongomock
import bcrypt

import globals
import decorators
from app import app

# import the *module* that defines users_collection / blacklist_collection
import blueprints.auth.auth as auth_module
import blueprints.clients.clients as clients_module
import blueprints.jobs.jobs as jobs_module
import blueprints.plans.weekly_plans as plans_module


@pytest.fixture(autouse=True)
def _mock_db(monkeypatch):
    mock_db = mongomock.MongoClient()["test_db"]

    monkeypatch.setattr(globals, "db", mock_db)
    monkeypatch.setattr(globals, "secret_key", "test-secret")

    # patch cached collections in the modules
    monkeypatch.setattr(auth_module, "users_collection", mock_db["users"])
    monkeypatch.setattr(auth_module, "blacklist_collection", mock_db["blacklist"])
    monkeypatch.setattr(decorators, "blacklist_collection", mock_db["blacklist"])
    monkeypatch.setattr(clients_module, "clients_collection", mock_db["clients"])
    monkeypatch.setattr(jobs_module, "jobs_collection", mock_db["jobs"])
    monkeypatch.setattr(jobs_module, "clients_collection", mock_db["clients"])
    monkeypatch.setattr(jobs_module, "job_updates_collection", mock_db["job_updates"])
    monkeypatch.setattr(plans_module, "weekly_plans_collection", mock_db["weekly_plans"])
    monkeypatch.setattr(plans_module, "jobs_collection", mock_db["jobs"])

    # seed admin
    hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8")
    mock_db["users"].insert_one({"username": "admin", "password": hashed, "admin": True})

    # seed non admin 
    hashed = bcrypt.hashpw(b"user123", bcrypt.gensalt()).decode("utf-8")
    mock_db["users"].insert_one({"username": "user", "password": hashed, "admin": False})

    yield


@pytest.fixture
def client():
    app_module = importlib.import_module("app")  # imports & registers blueprints
    app = app_module.app
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


@pytest.fixture
def auth_header(client):
    r = client.get(
        "/api/v1.0/login",
        headers={"Authorization": "Basic YWRtaW46YWRtaW4xMjM="},
    )
    token = r.get_json()["token"]
    return {"x-access-token": token}

@pytest.fixture
def user_auth_header(client):
    r = client.get(
        "/api/v1.0/login",
        headers={"Authorization": "Basic dXNlcjp1c2VyMTIz"},  # user:user123
    )
    token = r.get_json()["token"]
    return {"x-access-token": token}

@pytest.fixture
def created_client_id(client, auth_header):
    r = client.post(
        "/api/v1.0/clients",
        json={"name": "Client A", "phone": "123", "email": "a@b.com"},
        headers=auth_header,
    )
    return r.get_json()["id"]