# Anime Finder — Anime Discovery Platform

A modern, feature-rich anime discovery website with search, recommendations, rankings, and more. Built with Python Flask + vanilla HTML/CSS/JS. Designed as a portfolio-ready project for CS students.

## Features

### Core
- **Multi-Strategy Search** — Chinese, Japanese, English, pinyin fuzzy, and alias matching
- **Real-time Autocomplete** — Typeahead suggestions as you type
- **Random Discovery** — "Surprise Me" button for random highly-rated anime
- **Related Anime** — Automatically finds anime sharing genre tags
- **"You Might Like"** — Smart recommendations based on genre overlap, studio, era, and rating

### Discovery
- **Top Rated Rankings** — Browse the highest-rated anime
- **Top Airing** — See the newest releases (simulated as latest entries)
- **Genre Filters** — Browse by genre tag with one click
- **Search History** — Your recent searches remembered (localStorage)

### Personalization
- **Favorites** — Save anime to your favorites list (localStorage)
- **Daily Character** — A featured character that changes daily (deterministic seed)

### Detail Pages
- **Anime Detail** — Full info, synopsis, related, and recommendations
- **Studio Page** — Studio info with notable works
- **Character Page** — Character info with VA and source anime

### UI/UX
- **Dark Gradient Theme** — Purple/blue/pink neon aesthetic with glass morphism
- **Animated Particle Background** — Canvas-based floating starfield with connections
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Smooth Animations** — Card hover effects, skeleton loading, toast notifications

## Project Structure

```
anime_finder/
├── app.py                          # Main Flask entry point (app factory)
├── backend/
│   ├── __init__.py
│   ├── utils.py                    # Data loading, search engine, pinyin, recommendations
│   └── routes/
│       ├── __init__.py
│       ├── search.py               # /search, /autocomplete, /filter
│       ├── anime.py                # /anime/:id, /random, /ranking, /daily-waifu, /genres
│       ├── studio.py               # /studio/:id, /studios
│       └── character.py            # /character/:id, /characters
├── data/
│   ├── anime_part1.json              # Anime entries #1-100 (mainstream, classics, thriller)
│   ├── anime_part2.json              # Anime entries #101-200 (isekai, romance, sci-fi, mecha)
│   ├── anime_part3.json              # Anime entries #201-300 (CGDCT, sports, movies, niche)
│   ├── studios.json                  # Studio information
│   └── characters.json             # Character information
├── templates/
│   ├── index.html                  # Home page (search, rankings, filters, daily character)
│   ├── anime.html                  # Anime detail page
│   ├── studio.html                 # Studio detail page
│   └── character.html              # Character detail page
├── static/
│   ├── css/
│   │   └── style.css               # Complete stylesheet (design tokens, components, responsive)
│   └── js/
│       ├── app.js                  # Main app (particles, search, autocomplete, rankings, favorites)
│       └── anime.js                # Anime detail page logic
└── README.md
```

## Setup & Run

### Prerequisites
- Python 3.8+
- pip

### Install Dependencies

```bash
pip install flask
```

No other dependencies required — pinyin search uses a built-in character mapping.

### Run

```bash
cd anime_finder
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page |
| `/search?q=query&limit=50` | GET | Multi-strategy anime search |
| `/autocomplete?q=query` | GET | Lightweight typeahead suggestions |
| `/filter?genre=Action&limit=50` | GET | Filter by genre tag |
| `/anime/<id>` | GET | Anime detail with related + recommendations |
| `/random?rated=true` | GET | Random anime (optional: high-rated only) |
| `/ranking?sort=rating&limit=20` | GET | Top anime (sort: rating/popularity/newest) |
| `/top-airing` | GET | Newest anime (12 items) |
| `/related/<id>` | GET | Related anime by shared genres |
| `/you-might-like/<id>` | GET | Smart recommendations |
| `/daily-waifu` | GET | Today's featured character |
| `/genres` | GET | All genre tags with counts |
| `/studio/<id>` | GET | Studio detail with works |
| `/studios` | GET | All studios |
| `/character/<id>` | GET | Character detail |
| `/characters?anime_id=<id>` | GET | Characters (optional: filter by anime) |

## Extending

- **Switch to a database** → Replace `utils.py` data loading with SQLAlchemy/SQLite queries
- **Add real auth** → Add Flask-Login for user accounts and server-side favorites
- **Real cover images** → Store image URLs and load via `<img>` tags
- **Deploy** → `gunicorn app:create_app()` for production
- **Add pagination** → Extend search/filter routes with `page` and `offset` params

## License

MIT — Free to use for learning, portfolio, and personal projects.
