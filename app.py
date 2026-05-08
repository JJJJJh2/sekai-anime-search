"""
Anime Finder — Main Application Entry Point
Flask app factory with all route blueprints registered.
"""

from flask import Flask, render_template

# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------

def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False  # Preserve Unicode in JSON responses
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True

    # Register route blueprints
    from backend.routes.search import search_bp
    from backend.routes.anime import anime_bp
    from backend.routes.studio import studio_bp
    from backend.routes.character import character_bp

    app.register_blueprint(search_bp)
    app.register_blueprint(anime_bp)
    app.register_blueprint(studio_bp)
    app.register_blueprint(character_bp)

    # -----------------------------------------------------------------------
    # Page Routes (serve HTML templates)
    # -----------------------------------------------------------------------

    @app.route("/")
    def index():
        """Main discovery page: search, rankings, random, recommendations."""
        return render_template("index.html")

    @app.route("/anime/<int:anime_id>")
    def anime_page(anime_id: int):
        """Anime detail page."""
        return render_template("anime.html", anime_id=anime_id)

    @app.route("/studio/<int:studio_id>")
    def studio_page(studio_id: int):
        """Studio detail page."""
        return render_template("studio.html", studio_id=studio_id)

    @app.route("/character/<int:character_id>")
    def character_page(character_id: int):
        """Character detail page."""
        return render_template("character.html", character_id=character_id)

    return app


# ---------------------------------------------------------------------------
# Module-level app instance — required by gunicorn (gunicorn app:app)
# ---------------------------------------------------------------------------

app = create_app()


# ---------------------------------------------------------------------------
# Entry Point (direct execution: python app.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Anime Finder server starting at http://127.0.0.1:5000")
    app.run(debug=True, host="127.0.0.1", port=5000)
