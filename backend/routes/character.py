"""
Anime Finder — Character Routes
/character/<id>, /characters list.
"""

from flask import Blueprint, jsonify, request
from backend.utils import load_characters, load_anime, _find_by_id

character_bp = Blueprint("character", __name__)


@character_bp.route("/character/<int:character_id>")
def character_detail(character_id: int):
    """Return a character's info plus their anime details."""
    char = next((c for c in load_characters() if c["id"] == character_id), None)
    if char is None:
        return jsonify({"error": f"Character with id {character_id} not found."}), 404

    result = dict(char)
    # Attach anime info
    anime = _find_by_id(char.get("anime_id", 0))
    if anime:
        result["anime"] = {
            "id": anime["id"],
            "name_cn": anime.get("name_cn", ""),
            "name_en": anime.get("name_en", ""),
        }
    return jsonify({"results": [result]})


@character_bp.route("/characters")
def list_characters():
    """
    Return characters, optionally filtered by anime_id.
    Query: ?anime_id=1
    """
    anime_id = request.args.get("anime_id", type=int)
    chars = load_characters()
    if anime_id:
        chars = [c for c in chars if c.get("anime_id") == anime_id]
    return jsonify({"count": len(chars), "results": chars})
