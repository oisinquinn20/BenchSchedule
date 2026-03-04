def test_get_weekly_plan_requires_week_start(client, auth_header):
    r = client.get("/api/v1.0/weekly-plans", headers=auth_header)
    assert r.status_code == 400


def test_get_weekly_plan_returns_empty_if_missing(client, auth_header):
    r = client.get("/api/v1.0/weekly-plans?week_start=2026-02-23", headers=auth_header)
    assert r.status_code == 200
    assert r.get_json()["week_start"] == "2026-02-23"
    assert r.get_json()["days"] == {}


def test_put_weekly_plan_admin_only(client, user_auth_header):
    r = client.put(
        "/api/v1.0/weekly-plans/2026-02-23",
        json={"days": {}},
        headers=user_auth_header,
    )
    assert r.status_code == 401


def test_put_and_get_weekly_plan_success(client, auth_header, created_client_id):
    job = client.post(
        "/api/v1.0/jobs",
        json={"client_id": created_client_id, "title": "Plan job"},
        headers=auth_header,
    ).get_json()

    payload = {
        "days": {
            "monday": {
                "type": "workshop",
                "jobs": [job["id"]],
                "delivery_expected": True,
                "delivery_type": "doors",
            }
        }
    }

    put = client.put("/api/v1.0/weekly-plans/2026-02-23", json=payload, headers=auth_header)
    assert put.status_code == 200

    get = client.get("/api/v1.0/weekly-plans?week_start=2026-02-23", headers=auth_header)
    assert get.status_code == 200
    assert get.get_json()["days"]["monday"]["jobs"] == [job["id"]]


def test_put_weekly_plan_rejects_bad_day_type(client, auth_header):
    r = client.put(
        "/api/v1.0/weekly-plans/2026-02-23",
        json={"days": {"monday": {"type": "invalid", "jobs": []}}},
        headers=auth_header,
    )
    assert r.status_code == 400


def test_put_weekly_plan_delivery_type_required(client, auth_header):
    r = client.put(
        "/api/v1.0/weekly-plans/2026-02-23",
        json={"days": {"monday": {"type": "workshop", "jobs": [], "delivery_expected": True}}},
        headers=auth_header,
    )
    assert r.status_code == 400