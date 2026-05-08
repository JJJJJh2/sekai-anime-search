"""
Anime Finder — Anime Routes
/anime/<id>, /random, /ranking, /top-airing, /you-might-like, /daily-waifu.
"""

from flask import Blueprint, jsonify, request
from backend.utils import (
    load_anime, get_related, you_might_like,
    get_top_anime, get_top_airing, get_daily_waifu,
    random_recommendations, _find_by_id,
)

anime_bp = Blueprint("anime", __name__)


@anime_bp.route("/anime/<int:anime_id>")
def anime_detail(anime_id: int):
    """
    Return full detail for a single anime, including related and
    'you might like' recommendations.
    """
    anime = _find_by_id(anime_id)
    if anime is None:
        return jsonify({"error": f"Anime with id {anime_id} not found."}), 404

    result = dict(anime)
    result["related"] = get_related(anime_id, limit=6)
    result["you_might_like"] = you_might_like(anime_id, limit=6)
    return jsonify({"results": [result]})


@anime_bp.route("/random")
def random_anime():
    """
    Return a single random anime with related recommendations.
    Supports ?rated=true to only pick highly-rated anime (≥7.5).
    """
    import random
    rated_only = request.args.get("rated", "false").lower() == "true"
    if rated_only:
        pool = [a for a in load_anime() if a.get("rating", 0) >= 7.5]
        if not pool:
            pool = load_anime()
    else:
        pool = load_anime()

    anime = random.choice(pool)
    result = dict(anime)
    result["related"] = get_related(anime["id"], limit=6)
    result["you_might_like"] = you_might_like(anime["id"], limit=6)
    return jsonify({"results": [result]})


@anime_bp.route("/ranking")
def ranking():
    """
    Return top anime ranked by rating, popularity, or newest.

    Query params:
        sort  — "rating" (default) | "popularity" | "newest"
        limit — max results (default 20)
    """
    sort_by = request.args.get("sort", "rating")
    try:
        limit = int(request.args.get("limit", 20))
    except ValueError:
        limit = 20

    results = get_top_anime(limit=limit, sort_by=sort_by)
    return jsonify({
        "sort": sort_by,
        "count": len(results),
        "results": results,
    })


@anime_bp.route("/top-airing")
def top_airing():
    """Return the newest anime (simulating currently-airing list)."""
    results = get_top_airing(limit=12)
    return jsonify({"count": len(results), "results": results})


@anime_bp.route("/you-might-like/<int:anime_id>")
def you_might_like_route(anime_id: int):
    """Return personalized recommendations based on an anime."""
    results = you_might_like(anime_id, limit=6)
    return jsonify({"results": results})


@anime_bp.route("/related/<int:anime_id>")
def related_route(anime_id: int):
    """Return related anime by shared genre tags."""
    results = get_related(anime_id, limit=6)
    if not results:
        return jsonify({"error": "Anime not found.", "results": []}), 404
    return jsonify({"results": results})


@anime_bp.route("/daily-waifu")
def daily_waifu():
    """Return today's featured character (changes daily)."""
    char = get_daily_waifu()
    return jsonify({"character": char})


@anime_bp.route("/genres")
def list_genres():
    """Return all unique genre tags and their counts."""
    from collections import Counter
    genre_counter = Counter()
    for anime in load_anime():
        for g in anime.get("genres", []):
            genre_counter[g] += 1
    genres = [{"name": name, "count": count}
              for name, count in genre_counter.most_common()]
    return jsonify({"genres": genres})
