"""
Anime Finder — Studio Routes
/studio/<id>, /studios list.
"""

from flask import Blueprint, jsonify
from backend.utils import load_studios, load_anime

studio_bp = Blueprint("studio", __name__)


@studio_bp.route("/studio/<int:studio_id>")
def studio_detail(studio_id: int):
    """Return a studio's info plus its notable anime works."""
    studio = next((s for s in load_studios() if s["id"] == studio_id), None)
    if studio is None:
        return jsonify({"error": f"Studio with id {studio_id} not found."}), 404

    result = dict(studio)
    # Resolve notable works to actual anime objects
    anime_list = load_anime()
    result["works"] = [a for a in anime_list if a["id"] in studio.get("notable_works", [])]
    return jsonify({"results": [result]})


@studio_bp.route("/studios")
def list_studios():
    """Return all studios with their anime counts."""
    studios = load_studios()
    return jsonify({"count": len(studios), "results": studios})
