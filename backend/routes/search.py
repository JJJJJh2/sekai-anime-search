"""
Anime Finder — Search Routes
/search, /autocomplete, /filter endpoints.
"""

from flask import Blueprint, request, jsonify
from backend.utils import search_anime, autocomplete, filter_by_genre

search_bp = Blueprint("search", __name__)


@search_bp.route("/search")
def search():
    """
    Full multi-strategy search: Chinese, Japanese, English, pinyin, alias, genre.

    Query params:
        q     — search query string
        limit — max results (default 50)
    """
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Missing query parameter 'q'.", "results": []}), 400

    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        limit = 50

    results = search_anime(query, limit=limit)
    return jsonify({
        "query": query,
        "count": len(results),
        "results": results,
    })


@search_bp.route("/autocomplete")
def autocomplete_route():
    """
    Lightweight search for typeahead/autocomplete suggestions.
    Returns minimal anime objects suitable for a dropdown.
    """
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"suggestions": []})

    suggestions = autocomplete(query, limit=8)
    return jsonify({"suggestions": suggestions})


@search_bp.route("/filter")
def filter_by_genre_route():
    """
    Filter anime by genre tag.

    Query params:
        genre — genre name (e.g., "Action", "Romance")
        limit — max results (default 50)
    """
    genre = request.args.get("genre", "").strip()
    if not genre:
        return jsonify({"error": "Missing 'genre' parameter.", "results": []}), 400

    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        limit = 50

    results = filter_by_genre(genre, limit=limit)
    return jsonify({
        "genre": genre,
        "count": len(results),
        "results": results,
    })
