from flask import Blueprint, request, jsonify, make_response
import jwt, datetime, bcrypt
import globals
from decorators import jwt_required

auth_bp = Blueprint("auth_bp", __name__)

users_collection = globals.db["users"]
blacklist_collection = globals.db["blacklist"]

@auth_bp.route("/api/v1.0/login", methods=["GET"])
def login():
    auth = request.authorization
    if not auth:
        return make_response(jsonify({"message": "Authentication required"}), 401)

    user = users_collection.find_one({"username": auth.username})
    if not user:
        return make_response(jsonify({"message": "Invalid username"}), 401)

    if bcrypt.checkpw(auth.password.encode("utf-8"), user["password"].encode("utf-8")):
        token = jwt.encode(
            {
                "user": auth.username,
                "admin": user.get("admin", False),
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24),
            },
            globals.secret_key,
            algorithm="HS256",
        )
        return make_response(jsonify({"token": token}), 200)

    return make_response(jsonify({"message": "Invalid password"}), 401)


@auth_bp.route("/api/v1.0/logout", methods=["GET"])
@jwt_required
def logout():
    token = request.headers.get("x-access-token")
    if not token:
        return make_response(jsonify({"message": "Token missing"}), 401)

    blacklist_collection.insert_one({"token": token})
    return make_response(jsonify({"message": "Logout successful"}), 200)
 

@auth_bp.route("/api/v1.0/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return make_response(jsonify({"message": "Request must contain JSON"}), 400)

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return make_response(jsonify({"message": "Username and password are required"}), 400)

    # Check if username already exists
    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        return make_response(jsonify({"message": "Username already exists"}), 409)

    # Hash the password using the same logic login expects
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Create user document
    user_doc = {
        "username": username,
        "password": hashed_password,
        "admin": False  # default
    }

    users_collection.insert_one(user_doc)

    return make_response(jsonify({"message": "User registered successfully"}), 201)
