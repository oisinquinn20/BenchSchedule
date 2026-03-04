from flask import Blueprint, request, jsonify, make_response
from bson import ObjectId
import globals
from decorators import jwt_required, admin_required

weekly_plans_bp = Blueprint("weekly_plans_bp", __name__)

weekly_plans_collection = globals.db["weekly_plans"]
jobs_collection = globals.db["jobs"]

ALLOWED_DAY_TYPES = {"workshop", "fitting"}


def _plan_to_json(doc):
    return {
        "id": str(doc["_id"]),
        "week_start": doc.get("week_start"),
        "week_overview": doc.get("week_overview", ""),
        "days": doc.get("days"),
    }


@weekly_plans_bp.route("/api/v1.0/weekly-plans", methods=["GET"])
@jwt_required
def get_weekly_plan():
    week_start = request.args.get("week_start")
    if not week_start:
        return make_response(jsonify({"message": "week_start query param required"}), 400)

    doc = weekly_plans_collection.find_one({"week_start": week_start})
    if not doc:
        return make_response(jsonify({
            "week_start": week_start,
            "week_overview": "",
            "days": {}
        }), 200)

    return make_response(jsonify(_plan_to_json(doc)), 200)


@weekly_plans_bp.route("/api/v1.0/weekly-plans/<week_start>", methods=["PUT"])
@jwt_required
@admin_required
def save_weekly_plan(week_start):
    data = request.get_json(silent=True) or {}
    days = data.get("days")
    week_overview = (data.get("week_overview") or "").strip()

    if not isinstance(days, dict):
        return make_response(jsonify({"message": "days must be an object"}), 400)

    for day, info in days.items():
        # day type
        if info.get("type") not in ALLOWED_DAY_TYPES:
            return make_response(jsonify({
                "message": f"Invalid or missing type for {day}"
            }), 400)

        # jobs
        jobs = info.get("jobs", [])
        if not isinstance(jobs, list):
            return make_response(jsonify({
                "message": f"jobs must be a list for {day}"
            }), 400)

        for job_id in jobs:
            try:
                oid = ObjectId(job_id)
            except Exception:
                return make_response(jsonify({
                    "message": f"Invalid job id {job_id} for {day}"
                }), 400)

            if not jobs_collection.find_one({"_id": oid}):
                return make_response(jsonify({
                    "message": f"Job not found {job_id} for {day}"
                }), 404)

        # delivery fields
        delivery_expected = info.get("delivery_expected", False)
        if not isinstance(delivery_expected, bool):
            return make_response(jsonify({
                "message": f"delivery_expected must be boolean for {day}"
            }), 400)

        if delivery_expected:
            delivery_type = (info.get("delivery_type") or "").strip()
            if not delivery_type:
                return make_response(jsonify({
                    "message": f"delivery_type required when delivery_expected is true for {day}"
                }), 400)

    doc = {
        "week_start": week_start,
        "week_overview": week_overview,
        "days": days,
    }

    weekly_plans_collection.update_one(
        {"week_start": week_start},
        {"$set": doc},
        upsert=True
    )

    saved = weekly_plans_collection.find_one({"week_start": week_start})
    return make_response(jsonify(_plan_to_json(saved)), 200)
