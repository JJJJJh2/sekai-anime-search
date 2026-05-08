/* ==========================================================================
   Anime Finder — Anime Detail Page JavaScript
   ========================================================================== */

// Particle Background (shared across pages)
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.maxParticles = 80;
        this.resize();
        this.init();
        window.addEventListener("resize", () => this.resize());
        this.animate();
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    init() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5 + 0.4,
                speedX: (Math.random() - 0.5) * 0.25,
                speedY: (Math.random() - 0.5) * 0.25,
                opacity: Math.random() * 0.5 + 0.15,
                pulseSpeed: Math.random() * 0.015 + 0.005,
            });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of this.particles) {
            p.x += p.speedX; p.y += p.speedY;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            p.opacity += p.pulseSpeed;
            if (p.opacity > 0.7 || p.opacity < 0.1) p.pulseSpeed *= -1;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(180, 140, 255, ${p.opacity})`;
            this.ctx.fill();
        }
        requestAnimationFrame(() => this.animate());
    }
}

// Get anime_id from the data attribute set by the template
const animeId = parseInt(document.getElementById("animeData").getAttribute("data-anime-id"));

// DOM refs
const detailContent = document.getElementById("detailContent");
const relatedGrid = document.getElementById("relatedGrid");
const youMightLikeGrid = document.getElementById("youMightLikeGrid");

// ---------------------------------------------------------------------------
// Load anime detail
// ---------------------------------------------------------------------------
async function loadAnimeDetail() {
    try {
        const resp = await fetch(`/api/anime/${animeId}`);
        if (!resp.ok) {
            detailContent.innerHTML = `
                <div class="message-box">
                    <span class="message-emoji">🔍</span>
                    <p class="message-text">Anime not found.</p>
                </div>`;
            return;
        }
        const data = await resp.json();
        const anime = data.results[0];
        renderDetail(anime);
        renderRelated(anime.related || []);
        renderYouMightLike(anime.you_might_like || []);
    } catch (err) {
        console.error("Failed to load anime detail:", err);
        detailContent.innerHTML = `
            <div class="message-box">
                <span class="message-emoji">💥</span>
                <p class="message-text">Failed to load. Is the server running?</p>
            </div>`;
    }
}

// ---------------------------------------------------------------------------
// Render detail section
// ---------------------------------------------------------------------------
function renderDetail(anime) {
    document.title = `${anime.name_cn || anime.name_en} — Anime Finder`;
    document.getElementById("detailCover").style.background =
        anime.cover_gradient || "linear-gradient(135deg, #1a0533, #6b21a8)";
    document.getElementById("detailTitle").textContent = anime.name_cn || anime.name_en || "";
    document.getElementById("detailTitleJp").textContent = anime.name_jp || "";

    // Meta items
    const metaItems = [
        `📅 ${anime.year || "?"}`,
        `📺 ${anime.episodes || "?"} eps`,
        `⭐ ${(anime.rating || 0).toFixed(1)} / 10`,
        `🏷️ ${anime.type || "TV"}`,
        `🏢 ${anime.studio || "Unknown"}`,
    ];
    if (anime.season) metaItems.push(`🍂 ${anime.season}`);
    document.getElementById("detailMeta").innerHTML = metaItems
        .map(m => `<span class="detail-meta-item">${esc(m)}</span>`).join("");

    // Genres
    document.getElementById("detailGenres").innerHTML = (anime.genres || [])
        .map(g => `<span class="detail-genre-tag">${esc(g)}</span>`).join("");

    // Aliases
    const aliasesEl = document.getElementById("detailAliases");
    if (anime.aliases && anime.aliases.length > 0) {
        aliasesEl.textContent = "Also known as: " + anime.aliases.join(", ");
        aliasesEl.classList.remove("hidden");
    } else {
        aliasesEl.classList.add("hidden");
    }

    // Synopsis
    document.getElementById("detailSynopsis").textContent = anime.synopsis || "No synopsis available.";

    // Studio link
    const studioBtn = document.getElementById("studioLinkBtn");
    if (anime.studio) {
        studioBtn.classList.remove("hidden");
        studioBtn.addEventListener("click", () => {
            // Navigate to studio page — we'd need studio ID lookup
            // For now, search for the studio name
            window.location.href = `/?q=${encodeURIComponent(anime.studio)}`;
        });
    }

    // Favorite button
    const favs = JSON.parse(localStorage.getItem("anime_finder_favorites") || "[]");
    const favBtn = document.getElementById("favBtn");
    if (favs.includes(anime.id)) {
        favBtn.textContent = "💖 Favorited";
        favBtn.classList.add("active");
    }
    favBtn.addEventListener("click", () => {
        const currentFavs = JSON.parse(localStorage.getItem("anime_finder_favorites") || "[]");
        const idx = currentFavs.indexOf(anime.id);
        if (idx >= 0) {
            currentFavs.splice(idx, 1);
            favBtn.textContent = "🤍 Add to Favorites";
            favBtn.classList.remove("active");
        } else {
            currentFavs.push(anime.id);
            favBtn.textContent = "💖 Favorited";
            favBtn.classList.add("active");
        }
        localStorage.setItem("anime_finder_favorites", JSON.stringify(currentFavs));
    });
}

// ---------------------------------------------------------------------------
// Render related anime
// ---------------------------------------------------------------------------
function renderRelated(relatedList) {
    if (!relatedGrid) return;
    relatedGrid.innerHTML = "";
    if (relatedList.length === 0) {
        relatedGrid.innerHTML = '<p class="text-muted">No related anime found.</p>';
        return;
    }
    relatedList.forEach(anime => {
        relatedGrid.appendChild(buildMiniCard(anime));
    });
}

// ---------------------------------------------------------------------------
// Render "You Might Like" recommendations
// ---------------------------------------------------------------------------
function renderYouMightLike(recList) {
    if (!youMightLikeGrid) return;
    youMightLikeGrid.innerHTML = "";
    if (recList.length === 0) {
        youMightLikeGrid.innerHTML = '<p class="text-muted">No recommendations available.</p>';
        return;
    }
    recList.forEach(anime => {
        youMightLikeGrid.appendChild(buildMiniCard(anime));
    });
}

// ---------------------------------------------------------------------------
// Build a mini card for related/recommended sections
// ---------------------------------------------------------------------------
function buildMiniCard(anime) {
    const card = document.createElement("div");
    card.className = "anime-card";
    card.addEventListener("click", () => {
        window.location.href = `/anime/${anime.id}`;
    });

    const gradient = anime.cover_gradient || "linear-gradient(135deg, #1a0533, #6b21a8)";
    const genreTags = (anime.genres || []).slice(0, 3)
        .map(g => `<span class="card-genre-tag">${esc(g)}</span>`).join("");

    card.innerHTML = `
        <div class="card-cover">
            <div class="card-cover-inner" style="background:${gradient};width:100%;height:100%;"></div>
            <div class="card-cover-overlay"></div>
            <span class="card-rating-badge">★ ${(anime.rating || 0).toFixed(1)}</span>
        </div>
        <div class="card-body">
            <div class="card-title-row">
                <div class="card-title">${esc(anime.name_cn || anime.name_en)}</div>
            </div>
            <div class="card-title-jp">${esc(anime.name_jp || "")} · ${anime.year || "?"}</div>
            <div class="card-genres">${genreTags}</div>
            <p class="card-synopsis">${esc((anime.synopsis || "").substring(0, 120))}...</p>
            <div class="card-studio">🏢 ${esc(anime.studio || "Unknown")}</div>
        </div>
    `;
    return card;
}

// ---------------------------------------------------------------------------
// Escape helper
// ---------------------------------------------------------------------------
function esc(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    new ParticleBackground("particlesCanvas");
    loadAnimeDetail();
});
