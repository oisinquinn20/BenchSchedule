def _job_payload(client_id, **overrides):
    base = {
        "client_id": client_id,
        "title": "Job 1",
        "description": "Desc",
        "estimated_start": "2026-02-01",
        "estimated_end": "2026-02-10",
        "status": "planned",
    }
    base.update(overrides)
    return base


def test_list_jobs_requires_auth(client):
    r = client.get("/api/v1.0/jobs")
    assert r.status_code == 401


def test_create_job_admin_only(client, user_auth_header, created_client_id):
    r = client.post("/api/v1.0/jobs", json=_job_payload(created_client_id), headers=user_auth_header)
    assert r.status_code == 401


def test_create_job_success(client, auth_header, created_client_id):
    r = client.post("/api/v1.0/jobs", json=_job_payload(created_client_id), headers=auth_header)
    assert r.status_code == 201
    assert r.get_json()["client_id"] == created_client_id


def test_create_job_client_not_found(client, auth_header):
    r = client.post("/api/v1.0/jobs", json=_job_payload("000000000000000000000000"), headers=auth_header)
    assert r.status_code == 404


def test_list_jobs_filter_by_status(client, auth_header, created_client_id):
    client.post("/api/v1.0/jobs", json=_job_payload(created_client_id, title="A", status="planned"), headers=auth_header)
    client.post("/api/v1.0/jobs", json=_job_payload(created_client_id, title="B", status="completed"), headers=auth_header)

    r = client.get("/api/v1.0/jobs?status=completed", headers=auth_header)
    assert r.status_code == 200
    assert all(j["status"] == "completed" for j in r.get_json())


def test_update_job_status_patch(client, auth_header, created_client_id):
    created = client.post("/api/v1.0/jobs", json=_job_payload(created_client_id), headers=auth_header).get_json()
    jid = created["id"]

    r = client.patch(f"/api/v1.0/jobs/{jid}/status", json={"status": "in_progress"}, headers=auth_header)
    assert r.status_code == 200
    assert r.get_json()["status"] == "in_progress"

def test_add_and_list_job_updates(client, auth_header, created_client_id):
    # create job
    job = client.post(
        "/api/v1.0/jobs",
        json={"client_id": created_client_id, "title": "Job with updates"},
        headers=auth_header,
    ).get_json()
    job_id = job["id"]

    # add update
    add = client.post(
        f"/api/v1.0/jobs/{job_id}/updates",
        json={"text": "kitchen built"},
        headers=auth_header,
    )
    assert add.status_code == 201

    # list updates
    lst = client.get(f"/api/v1.0/jobs/{job_id}/updates", headers=auth_header)
    assert lst.status_code == 200
    updates = lst.get_json()

    assert len(updates) == 1
    assert updates[0]["text"] == "kitchen built"
    assert updates[0]["created_by"] == "admin"
    assert updates[0]["created_at"]