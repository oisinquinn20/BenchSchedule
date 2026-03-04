from flask import Blueprint, request, jsonify, make_response
from bson import ObjectId
import globals
import jwt
import datetime
from decorators import jwt_required, admin_required

jobs_bp = Blueprint("jobs_bp", __name__)

jobs_collection = globals.db["jobs"]
clients_collection = globals.db["clients"]
job_updates_collection = globals.db["job_updates"]

ALLOWED_STATUSES = {"planned", "in_progress", "completed", "on_hold"}

def _job_to_json(doc):
    return {
        "id": str(doc["_id"]),
        "client_id": str(doc["client_id"]) if doc.get("client_id") else None,
        "title": doc.get("title"),
        "description": doc.get("description"),
        "estimated_start": doc.get("estimated_start"),
        "estimated_end": doc.get("estimated_end"),
        "status": doc.get("status"),
    }

def _parse_object_id(value, field_name):
    try:
        return ObjectId(value)
    except Exception:
        return None
    
def _get_username_from_token():
    token = request.headers.get("x-access-token")
    if not token:
        return None
    try:
        data = jwt.decode(token, globals.secret_key, algorithms=["HS256"])
        return data.get("user")
    except Exception:
        return None

@jobs_bp.route("/api/v1.0/jobs", methods=["GET"])
@jwt_required
def list_jobs():
    client_id = request.args.get("client_id")
    status = request.args.get("status")

    query = {}

    if client_id:
        oid = _parse_object_id(client_id, "client_id")
        if not oid:
            return make_response(jsonify({"message": "Invalid client_id"}), 400)
        query["client_id"] = oid

    if status:
        if status not in ALLOWED_STATUSES:
            return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)
        query["status"] = status

    docs = list(jobs_collection.find(query).sort("_id", -1))
    return make_response(jsonify([_job_to_json(d) for d in docs]), 200)

@jobs_bp.route("/api/v1.0/jobs", methods=["POST"])
@jwt_required
@admin_required
def create_job():
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return make_response(jsonify({"message": "Field 'title' is required"}), 400)

    client_id = data.get("client_id")
    if not client_id:
        return make_response(jsonify({"message": "Field 'client_id' is required"}), 400)

    client_oid = _parse_object_id(client_id, "client_id")
    if not client_oid:
        return make_response(jsonify({"message": "Invalid client_id"}), 400)

    if not clients_collection.find_one({"_id": client_oid}):
        return make_response(jsonify({"message": "Client not found"}), 404)

    status = (data.get("status") or "planned").strip()
    if status not in ALLOWED_STATUSES:
        return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)

    new_doc = {
        "client_id": client_oid,
        "title": title,
        "description": (data.get("description") or "").strip(),
        "estimated_start": (data.get("estimated_start") or "").strip(),
        "estimated_end": (data.get("estimated_end") or "").strip(),
        "status": status,
    }

    result = jobs_collection.insert_one(new_doc)
    created = jobs_collection.find_one({"_id": result.inserted_id})
    return make_response(jsonify(_job_to_json(created)), 201)

@jobs_bp.route("/api/v1.0/jobs/<job_id>", methods=["GET"])
@jwt_required
def get_job(job_id):
    try:
        oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    doc = jobs_collection.find_one({"_id": oid})
    if not doc:
        return make_response(jsonify({"message": "Job not found"}), 404)

    return make_response(jsonify(_job_to_json(doc)), 200)

@jobs_bp.route("/api/v1.0/jobs/<job_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_job(job_id):
    try:
        oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    data = request.get_json(silent=True) or {}

    update_fields = {}

    if "title" in data:
        update_fields["title"] = (data.get("title") or "").strip()
        if not update_fields["title"]:
            return make_response(jsonify({"message": "Field 'title' cannot be empty"}), 400)

    if "description" in data:
        update_fields["description"] = (data.get("description") or "").strip()

    if "estimated_start" in data:
        update_fields["estimated_start"] = (data.get("estimated_start") or "").strip()

    if "estimated_end" in data:
        update_fields["estimated_end"] = (data.get("estimated_end") or "").strip()

    if "status" in data:
        status = (data.get("status") or "").strip()
        if status not in ALLOWED_STATUSES:
            return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)
        update_fields["status"] = status

    if "client_id" in data:
        client_oid = _parse_object_id(data.get("client_id"), "client_id")
        if not client_oid:
            return make_response(jsonify({"message": "Invalid client_id"}), 400)
        if not clients_collection.find_one({"_id": client_oid}):
            return make_response(jsonify({"message": "Client not found"}), 404)
        update_fields["client_id"] = client_oid

    if not update_fields:
        return make_response(jsonify({"message": "No valid fields to update"}), 400)

    result = jobs_collection.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return make_response(jsonify({"message": "Job not found"}), 404)

    doc = jobs_collection.find_one({"_id": oid})
    return make_response(jsonify(_job_to_json(doc)), 200)

@jobs_bp.route("/api/v1.0/jobs/<job_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_job(job_id):
    try:
        oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    result = jobs_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return make_response(jsonify({"message": "Job not found"}), 404)

    return make_response(jsonify({"message": "Job deleted successfully"}), 200)

@jobs_bp.route("/api/v1.0/jobs/<job_id>/updates", methods=["POST"])
@jwt_required
def add_job_update(job_id):
    try:
        job_oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    if not jobs_collection.find_one({"_id": job_oid}):
        return make_response(jsonify({"message": "Job not found"}), 404)

    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return make_response(jsonify({"message": "Field 'text' is required"}), 400)

    username = _get_username_from_token() or "unknown"

    doc = {
        "job_id": job_oid,
        "text": text,
        "created_by": username,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    job_updates_collection.insert_one(doc)
    return make_response(jsonify({"message": "Update added"}), 201)

@jobs_bp.route("/api/v1.0/jobs/<job_id>/updates", methods=["GET"])
@jwt_required
def list_job_updates(job_id):
    try:
        job_oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    if not jobs_collection.find_one({"_id": job_oid}):
        return make_response(jsonify({"message": "Job not found"}), 404)

    docs = list(job_updates_collection.find({"job_id": job_oid}).sort("_id", -1))
    updates = [
        {
            "id": str(d["_id"]),
            "job_id": str(d["job_id"]),
            "text": d.get("text"),
            "created_by": d.get("created_by"),
            "created_at": d.get("created_at"),
        }
        for d in docs
    ]
    return make_response(jsonify(updates), 200)

@jobs_bp.route("/api/v1.0/jobs/<job_id>/status", methods=["PATCH"])
@jwt_required
@admin_required
def update_job_status(job_id):
    try:
        oid = ObjectId(job_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid job id"}), 400)

    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "").strip()

    if status not in ALLOWED_STATUSES:
        return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)

    result = jobs_collection.update_one({"_id": oid}, {"$set": {"status": status}})
    if result.matched_count == 0:
        return make_response(jsonify({"message": "Job not found"}), 404)

    doc = jobs_collection.find_one({"_id": oid})
    return make_response(jsonify(_job_to_json(doc)), 200)