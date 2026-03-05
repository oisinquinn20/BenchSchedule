from flask import Blueprint, request, jsonify, make_response
from bson import ObjectId
import globals
from decorators import jwt_required, admin_required

projects_bp = Blueprint("projects_bp", __name__)

projects_collection = globals.db["projects"]
clients_collection = globals.db["clients"]

ALLOWED_STATUSES = {"planned", "in_progress", "completed", "on_hold"}

def _project_to_json(doc):
    return {
        "id": str(doc["_id"]),
        "client_id": str(doc["client_id"]) if doc.get("client_id") else None,
        "name": doc.get("name"),
        "status": doc.get("status"),
    }

def _parse_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


@projects_bp.route("/api/v1.0/projects", methods=["GET"])
@jwt_required
def list_projects():
    client_id = request.args.get("client_id")
    query = {}

    if client_id:
        oid = _parse_object_id(client_id)
        if not oid:
            return make_response(jsonify({"message": "Invalid client_id"}), 400)
        query["client_id"] = oid

    docs = list(projects_collection.find(query).sort("_id", -1))
    return make_response(jsonify([_project_to_json(d) for d in docs]), 200)


@projects_bp.route("/api/v1.0/projects", methods=["POST"])
@jwt_required
@admin_required
def create_project():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    if not name:
        return make_response(jsonify({"message": "Field 'name' is required"}), 400)

    client_id = data.get("client_id")
    if not client_id:
        return make_response(jsonify({"message": "Field 'client_id' is required"}), 400)

    client_oid = _parse_object_id(client_id)
    if not client_oid:
        return make_response(jsonify({"message": "Invalid client_id"}), 400)

    if not clients_collection.find_one({"_id": client_oid}):
        return make_response(jsonify({"message": "Client not found"}), 404)

    status = (data.get("status") or "planned").strip()
    if status not in ALLOWED_STATUSES:
        return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)

    doc = {
        "client_id": client_oid,
        "name": name,
        "status": status,
    }

    res = projects_collection.insert_one(doc)
    created = projects_collection.find_one({"_id": res.inserted_id})
    return make_response(jsonify(_project_to_json(created)), 201)


@projects_bp.route("/api/v1.0/projects/<project_id>", methods=["GET"])
@jwt_required
def get_project(project_id):
    oid = _parse_object_id(project_id)
    if not oid:
        return make_response(jsonify({"message": "Invalid project id"}), 400)

    doc = projects_collection.find_one({"_id": oid})
    if not doc:
        return make_response(jsonify({"message": "Project not found"}), 404)

    return make_response(jsonify(_project_to_json(doc)), 200)


@projects_bp.route("/api/v1.0/projects/<project_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_project(project_id):
    oid = _parse_object_id(project_id)
    if not oid:
        return make_response(jsonify({"message": "Invalid project id"}), 400)

    data = request.get_json(silent=True) or {}
    update_fields = {}

    if "name" in data:
        update_fields["name"] = (data.get("name") or "").strip()
        if not update_fields["name"]:
            return make_response(jsonify({"message": "Field 'name' cannot be empty"}), 400)

    if "status" in data:
        status = (data.get("status") or "").strip()
        if status not in ALLOWED_STATUSES:
            return make_response(jsonify({"message": f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}"}), 400)
        update_fields["status"] = status

    if not update_fields:
        return make_response(jsonify({"message": "No valid fields to update"}), 400)

    res = projects_collection.update_one({"_id": oid}, {"$set": update_fields})
    if res.matched_count == 0:
        return make_response(jsonify({"message": "Project not found"}), 404)

    doc = projects_collection.find_one({"_id": oid})
    return make_response(jsonify(_project_to_json(doc)), 200)


@projects_bp.route("/api/v1.0/projects/<project_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_project(project_id):
    oid = _parse_object_id(project_id)
    if not oid:
        return make_response(jsonify({"message": "Invalid project id"}), 400)

    res = projects_collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        return make_response(jsonify({"message": "Project not found"}), 404)

    return make_response(jsonify({"message": "Project deleted successfully"}), 200)
