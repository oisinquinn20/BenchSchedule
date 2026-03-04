from flask import request, jsonify, make_response
import jwt
from functools import wraps
import globals

blacklist_collection = globals.db["blacklist"]

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("x-access-token")
        if not token:
            return make_response(jsonify({"message": "Token is missing!"}), 401)
        if blacklist_collection.find_one({"token": token}):
            return make_response(jsonify({"message": "Token has been cancelled"}), 401)
        try:
            jwt.decode(token, globals.secret_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return make_response(jsonify({"message": "Token expired"}), 401)
        except Exception:
            return make_response(jsonify({"message": "Token invalid"}), 401)
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("x-access-token")
        if not token:
            return make_response(jsonify({"message": "Token missing"}), 401)
        data = jwt.decode(token, globals.secret_key, algorithms=["HS256"])
        if data.get("admin"):
            return f(*args, **kwargs)
        return make_response(jsonify({"message": "Admin access required"}), 401)
    return decorated
