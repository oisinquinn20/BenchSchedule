from flask import Blueprint, request, jsonify, make_response
from bson import ObjectId
import globals
from decorators import jwt_required, admin_required
from client_validators import is_valid_email, is_valid_phone


clients_bp = Blueprint("clients_bp", __name__)
clients_collection = globals.db["clients"]


def _client_to_json(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "phone": doc.get("phone"),
        "email": doc.get("email"),
        "address": doc.get("address"),
        "description": doc.get("description"),
    }


@clients_bp.route("/api/v1.0/clients", methods=["GET"])
@jwt_required
def list_clients():
    name = request.args.get("name")

    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}

    docs = list(clients_collection.find(query).sort("_id", -1))
    return make_response(jsonify([_client_to_json(d) for d in docs]), 200)



@clients_bp.route("/api/v1.0/clients", methods=["POST"])
@jwt_required
@admin_required
def create_client():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    if not name:
        return make_response(jsonify({"message": "Field 'name' is required"}), 400)

    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()

    if not is_valid_phone(phone):
        return make_response(jsonify({"message": "Invalid phone number"}), 400)

    if not is_valid_email(email):
        return make_response(jsonify({"message": "Invalid email format"}), 400)

    new_doc = {
        "name": name,
        "phone": phone,
        "email": email,
        "address": (data.get("address") or "").strip(),
        "description": (data.get("description") or "").strip(),
    }

    result = clients_collection.insert_one(new_doc)
    created = clients_collection.find_one({"_id": result.inserted_id})
    return make_response(jsonify(_client_to_json(created)), 201)



@clients_bp.route("/api/v1.0/clients/<client_id>", methods=["GET"])
@jwt_required
def get_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid client id"}), 400)

    doc = clients_collection.find_one({"_id": oid})
    if not doc:
        return make_response(jsonify({"message": "Client not found"}), 404)

    return make_response(jsonify(_client_to_json(doc)), 200)


@clients_bp.route("/api/v1.0/clients/<client_id>", methods=["PUT"])
@jwt_required
@admin_required
def update_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid client id"}), 400)

    data = request.get_json(silent=True) or {}

    update_fields = {}
    for field in ["name", "phone", "email", "address", "description"]:
        if field in data:
            val = data.get(field)
            update_fields[field] = (val or "").strip() if isinstance(val, str) else val

    if "name" in update_fields and not update_fields["name"]:
        return make_response(jsonify({"message": "Field 'name' cannot be empty"}), 400)

    if not update_fields:
        return make_response(jsonify({"message": "No valid fields to update"}), 400)

    result = clients_collection.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return make_response(jsonify({"message": "Client not found"}), 404)

    doc = clients_collection.find_one({"_id": oid})
    return make_response(jsonify(_client_to_json(doc)), 200)

@clients_bp.route("/api/v1.0/clients/<client_id>", methods=["DELETE"])
@jwt_required
@admin_required
def delete_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return make_response(jsonify({"message": "Invalid client id"}), 400)

    result = clients_collection.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return make_response(jsonify({"message": "Client not found"}), 404)

    return make_response(jsonify({"message": "Client deleted successfully"}), 200)


