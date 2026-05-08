/* ==========================================================================
   Anime Finder — Main Application JavaScript
   Particles • Search • Autocomplete • Rankings • Favorites • History
   ========================================================================== */

// ---------------------------------------------------------------------------
// Global State
// ---------------------------------------------------------------------------
const state = {
    currentQuery: "",
    favorites: JSON.parse(localStorage.getItem("anime_finder_favorites") || "[]"),
    searchHistory: JSON.parse(localStorage.getItem("anime_finder_history") || "[]"),
    currentGenre: null,
};

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    searchInput: $("#searchInput"),
    searchBtn: $("#searchBtn"),
    randomBtn: $("#randomBtn"),
    autocomplete: $("#autocompleteDropdown"),
    resultsSection: $("#resultsSection"),
    resultsHeading: $("#resultsHeading"),
    resultsGrid: $("#resultsGrid"),
    loadingState: $("#loadingState"),
    messageBox: $("#messageBox"),
    topAiringRow: $("#topAiringRow"),
    rankingGrid: $("#rankingGrid"),
    genreFilters: $("#genreFilters"),
    searchHistorySection: $("#searchHistorySection"),
    historyTags: $("#historyTags"),
    dailyWaifu: $("#dailyWaifuSection"),
};

// ---------------------------------------------------------------------------
// Particle Background — Animated canvas starfield
// ---------------------------------------------------------------------------
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.maxParticles = 120;
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
                radius: Math.random() * 1.8 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.6 + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.005,
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of this.particles) {
            // Move
            p.x += p.speedX;
            p.y += p.speedY;
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            // Pulse opacity
            p.opacity += p.pulseSpeed;
            if (p.opacity > 0.8 || p.opacity < 0.15) p.pulseSpeed *= -1;
            // Draw
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            gradient.addColorStop(0, `rgba(200, 160, 255, ${p.opacity})`);
            gradient.addColorStop(1, "rgba(200, 160, 255, 0)");
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        // Draw connections between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(168, 85, 247, ${0.08 * (1 - dist / 100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particles on load
document.addEventListener("DOMContentLoaded", () => {
    new ParticleBackground("particlesCanvas");
    loadTopAiring();
    loadRankings();
    loadGenreFilters();
    loadDailyWaifu();
    loadSearchHistory();
});

// ---------------------------------------------------------------------------
// Escape HTML helper
// ---------------------------------------------------------------------------
function esc(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------
function showToast(message, duration = 2500) {
    const existing = $(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ---------------------------------------------------------------------------
// Build gradient cover placeholder
// ---------------------------------------------------------------------------
function buildCoverDiv(gradient, extraClass = "") {
    const div = document.createElement("div");
    div.className = `card-cover ${extraClass}`;
    const inner = document.createElement("div");
    inner.className = "card-cover-inner";
    inner.style.background = gradient || "linear-gradient(135deg, #1a0533, #6b21a8)";
    inner.style.width = "100%";
    inner.style.height = "100%";
    div.appendChild(inner);
    return div;
}

// ---------------------------------------------------------------------------
// Build anime card
// ---------------------------------------------------------------------------
function buildAnimeCard(anime, showRelated = false) {
    const card = document.createElement("div");
    card.className = "anime-card";
    card.setAttribute("data-anime-id", anime.id);

    // Cover
    const cover = buildCoverDiv(anime.cover_gradient || "");
    // Badges
    cover.innerHTML += `
        <span class="card-rating-badge">★ ${(anime.rating || 0).toFixed(1)}</span>
        <span class="card-type-badge">${esc(anime.type || "TV")}</span>
    `;

    // Genre tags
    const genreTags = (anime.genres || []).slice(0, 4)
        .map(g => `<span class="card-genre-tag">${esc(g)}</span>`).join("");

    // Is favorited?
    const isFav = state.favorites.includes(anime.id);

    card.innerHTML = cover.outerHTML + `
        <div class="card-body">
            <div class="card-title-row">
                <div>
                    <div class="card-title">${esc(anime.name_cn || anime.name_en || "")}</div>
                    <div class="card-title-jp">${esc(anime.name_jp || "")} · ${anime.year || "?"}</div>
                </div>
            </div>
            <div class="card-genres">${genreTags}</div>
            <p class="card-synopsis">${esc((anime.synopsis || "").substring(0, 150))}...</p>
            <div class="card-studio">🏢 ${esc(anime.studio || "Unknown Studio")}</div>
            <div class="card-footer">
                <button class="fav-btn ${isFav ? 'faved' : ''}" title="Favorite" data-fav-id="${anime.id}">
                    ${isFav ? '💖' : '🤍'}
                </button>
                <button class="btn btn-outline btn-sm view-detail-btn" data-anime-id="${anime.id}">
                    Details →
                </button>
            </div>
        </div>
    `;

    // Click on card (not on buttons) goes to detail
    card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        window.location.href = `/anime/${anime.id}`;
    });

    // Favorite button
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(anime.id);
    });

    // Detail button
    card.querySelector(".view-detail-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `/anime/${anime.id}`;
    });

    return card;
}

// ---------------------------------------------------------------------------
// Build horizontal scroll card (for top airing / rankings)
// ---------------------------------------------------------------------------
function buildHScrollCard(anime, index) {
    const card = document.createElement("div");
    card.className = "h-scroll-card";
    card.setAttribute("data-anime-id", anime.id);
    card.addEventListener("click", () => {
        window.location.href = `/anime/${anime.id}`;
    });

    const cover = buildCoverDiv(anime.cover_gradient || "", "h-scroll-cover");
    cover.querySelector(".card-cover-inner").style.background =
        anime.cover_gradient || "linear-gradient(135deg, #1a0533, #6b21a8)";

    const rankBadge = index !== undefined
        ? `<span class="h-scroll-rank">#${index + 1}</span>` : "";

    card.innerHTML = `
        <div class="h-scroll-cover">
            ${cover.innerHTML}
            ${rankBadge}
        </div>
        <div class="h-scroll-body">
            <div class="h-scroll-title">${esc(anime.name_cn || anime.name_en)}</div>
            <div class="h-scroll-meta">★ ${(anime.rating || 0).toFixed(1)} · ${anime.year || "?"}</div>
        </div>
    `;
    return card;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
let searchDebounceTimer;

async function performSearch(query) {
    const q = query.trim();
    if (!q) {
        showMessage("🔍", "Enter a search term to discover anime.",
            "Try Chinese, Japanese, English, pinyin, or genre tags.");
        return;
    }

    state.currentQuery = q;
    addToSearchHistory(q);
    showLoading();
    dom.autocomplete.classList.remove("active");

    try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=40`);
        if (!resp.ok) throw new Error("Search failed");
        const data = await resp.json();
        hideLoading();

        if (data.results.length === 0) {
            showMessage("🔮", `No results for "${esc(q)}".`,
                "Try different keywords, romanji, pinyin, or browse by genre below.");
        } else {
            renderResults(data.results, `Found ${data.count} anime for "${esc(q)}"`);
        }
    } catch (err) {
        console.error("Search error:", err);
        hideLoading();
        showMessage("💥", "Network error. Is the server running?",
            "Make sure Flask is running at http://127.0.0.1:5000");
    }
}

// ---------------------------------------------------------------------------
// Autocomplete
// ---------------------------------------------------------------------------
async function fetchAutocomplete(query) {
    const q = query.trim();
    if (q.length < 1) {
        dom.autocomplete.classList.remove("active");
        return;
    }

    try {
        const resp = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
        const data = await resp.json();
        if (data.suggestions.length === 0) {
            dom.autocomplete.classList.remove("active");
            return;
        }

        dom.autocomplete.innerHTML = data.suggestions.map((a, i) => `
            <div class="autocomplete-item ${i === 0 ? 'active' : ''}" data-anime-id="${a.id}">
                <div class="ac-cover" style="background:${esc(a.cover_gradient || 'linear-gradient(135deg,#1a0533,#6b21a8)')};border-radius:4px;"></div>
                <div class="ac-info">
                    <div class="ac-title">${esc(a.name_cn)}</div>
                    <div class="ac-meta">
                        <span>${esc(a.name_en || "")}</span>
                        <span>·</span>
                        <span>${(a.genres || []).slice(0, 2).join(", ")}</span>
                    </div>
                </div>
            </div>
        `).join("");

        dom.autocomplete.classList.add("active");

        // Click handlers
        dom.autocomplete.querySelectorAll(".autocomplete-item").forEach(item => {
            item.addEventListener("click", () => {
                const id = item.getAttribute("data-anime-id");
                window.location.href = `/anime/${id}`;
            });
        });
    } catch (err) {
        // Silently fail for autocomplete
    }
}

// ---------------------------------------------------------------------------
// Render results grid
// ---------------------------------------------------------------------------
function renderResults(results, heading) {
    dom.messageBox.classList.add("hidden");
    dom.resultsSection.classList.remove("hidden");
    dom.resultsHeading.textContent = heading;
    dom.resultsGrid.innerHTML = "";

    results.forEach(anime => {
        dom.resultsGrid.appendChild(buildAnimeCard(anime));
    });
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------
function showLoading() {
    dom.messageBox.classList.add("hidden");
    dom.resultsSection.classList.remove("hidden");
    dom.resultsHeading.textContent = "Searching...";
    dom.resultsGrid.innerHTML = `
        <div class="skeleton-card"><div class="skeleton-cover"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div></div>
        <div class="skeleton-card"><div class="skeleton-cover"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div></div>
        <div class="skeleton-card"><div class="skeleton-cover"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div></div>
    `;
}

function hideLoading() {
    // Loading is replaced by actual content
}

// ---------------------------------------------------------------------------
// Message box
// ---------------------------------------------------------------------------
function showMessage(emoji, text, hint) {
    dom.resultsSection.classList.add("hidden");
    dom.messageBox.classList.remove("hidden");
    dom.messageBox.innerHTML = `
        <div class="message-emoji">${emoji}</div>
        <p class="message-text">${text}</p>
        ${hint ? `<p class="message-hint">${hint}</p>` : ""}
    `;
}

// ---------------------------------------------------------------------------
// Top Airing Section
// ---------------------------------------------------------------------------
async function loadTopAiring() {
    try {
        const resp = await fetch("/api/top-airing");
        const data = await resp.json();
        if (dom.topAiringRow && data.results.length > 0) {
            dom.topAiringRow.innerHTML = "";
            data.results.forEach((anime, i) => {
                dom.topAiringRow.appendChild(buildHScrollCard(anime, i));
            });
        }
    } catch (err) {
        console.error("Failed to load top airing:", err);
    }
}

// ---------------------------------------------------------------------------
// Rankings Section
// ---------------------------------------------------------------------------
async function loadRankings() {
    try {
        const resp = await fetch("/api/ranking?limit=12");
        const data = await resp.json();
        if (dom.rankingGrid && data.results.length > 0) {
            dom.rankingGrid.innerHTML = "";
            data.results.forEach((anime) => {
                dom.rankingGrid.appendChild(buildAnimeCard(anime));
            });
        }
    } catch (err) {
        console.error("Failed to load rankings:", err);
    }
}

// ---------------------------------------------------------------------------
// Genre Filters
// ---------------------------------------------------------------------------
async function loadGenreFilters() {
    try {
        const resp = await fetch("/api/genres");
        const data = await resp.json();
        if (dom.genreFilters && data.genres.length > 0) {
            // Show top 15 genres as filter pills
            const topGenres = data.genres.slice(0, 15);
            dom.genreFilters.innerHTML = topGenres.map(g =>
                `<span class="genre-pill" data-genre="${esc(g.name)}">${esc(g.name)} (${g.count})</span>`
            ).join("");

            dom.genreFilters.querySelectorAll(".genre-pill").forEach(pill => {
                pill.addEventListener("click", () => {
                    const genre = pill.getAttribute("data-genre");
                    // Toggle active
                    dom.genreFilters.querySelectorAll(".genre-pill").forEach(p => p.classList.remove("active"));
                    pill.classList.add("active");
                    state.currentGenre = genre;
                    filterByGenre(genre);
                });
            });
        }
    } catch (err) {
        console.error("Failed to load genres:", err);
    }
}

async function filterByGenre(genre) {
    showLoading();
    try {
        const resp = await fetch(`/api/filter?genre=${encodeURIComponent(genre)}&limit=40`);
        const data = await resp.json();
        hideLoading();
        if (data.results.length > 0) {
            renderResults(data.results, `Genre: ${esc(genre)} (${data.count} anime)`);
        } else {
            showMessage("🏷️", `No anime found for genre "${esc(genre)}".`);
        }
    } catch (err) {
        hideLoading();
        showMessage("💥", "Failed to filter by genre.");
    }
}

// ---------------------------------------------------------------------------
// Daily Waifu/Husbando
// ---------------------------------------------------------------------------
async function loadDailyWaifu() {
    try {
        const resp = await fetch("/api/daily-waifu");
        const data = await resp.json();
        const char = data.character;
        if (dom.dailyWaifu && char) {
            dom.dailyWaifu.classList.remove("hidden");
            dom.dailyWaifu.querySelector(".dw-name").textContent = char.name_cn || char.name_en;
            dom.dailyWaifu.querySelector(".dw-anime").textContent = char.anime_name || "";
            dom.dailyWaifu.querySelector(".dw-desc").textContent = char.description || "";
            const coverDiv = dom.dailyWaifu.querySelector(".dw-cover");
            if (coverDiv && char.cover_gradient) {
                coverDiv.style.background = char.cover_gradient;
            }
        }
    } catch (err) {
        console.error("Daily waifu load failed:", err);
    }
}

// ---------------------------------------------------------------------------
// Favorites (localStorage)
// ---------------------------------------------------------------------------
function toggleFavorite(animeId) {
    const idx = state.favorites.indexOf(animeId);
    if (idx >= 0) {
        state.favorites.splice(idx, 1);
        showToast("Removed from favorites 💔");
    } else {
        state.favorites.push(animeId);
        showToast("Added to favorites! 💖");
    }
    localStorage.setItem("anime_finder_favorites", JSON.stringify(state.favorites));
    // Refresh visible cards
    refreshFavoriteButtons();
}

function refreshFavoriteButtons() {
    $$(".fav-btn").forEach(btn => {
        const id = parseInt(btn.getAttribute("data-fav-id"));
        if (state.favorites.includes(id)) {
            btn.classList.add("faved");
            btn.textContent = "💖";
        } else {
            btn.classList.remove("faved");
            btn.textContent = "🤍";
        }
    });
}

// ---------------------------------------------------------------------------
// Search History (localStorage, max 10)
// ---------------------------------------------------------------------------
function addToSearchHistory(query) {
    // Remove duplicate
    state.searchHistory = state.searchHistory.filter(h => h !== query);
    state.searchHistory.unshift(query);
    if (state.searchHistory.length > 10) state.searchHistory.pop();
    localStorage.setItem("anime_finder_history", JSON.stringify(state.searchHistory));
    renderSearchHistory();
}

function renderSearchHistory() {
    if (!dom.historyTags) return;
    if (state.searchHistory.length === 0) {
        dom.searchHistorySection.classList.add("hidden");
        return;
    }
    dom.searchHistorySection.classList.remove("hidden");
    dom.historyTags.innerHTML = state.searchHistory.map(h =>
        `<span class="genre-pill history-tag" data-query="${esc(h)}">🕐 ${esc(h)}</span>`
    ).join("");

    dom.historyTags.querySelectorAll(".history-tag").forEach(tag => {
        tag.addEventListener("click", () => {
            const q = tag.getAttribute("data-query");
            dom.searchInput.value = q;
            performSearch(q);
        });
    });
}

function loadSearchHistory() {
    renderSearchHistory();
}

// ---------------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------------

// Search button
if (dom.searchBtn) {
    dom.searchBtn.addEventListener("click", () => {
        performSearch(dom.searchInput.value);
    });
}

// Enter key in search
if (dom.searchInput) {
    dom.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            performSearch(dom.searchInput.value);
        }
    });

    // Autocomplete on input (debounced)
    dom.searchInput.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            fetchAutocomplete(dom.searchInput.value);
        }, 200);
    });

    // Close autocomplete on blur
    dom.searchInput.addEventListener("blur", () => {
        setTimeout(() => dom.autocomplete.classList.remove("active"), 150);
    });

    dom.searchInput.addEventListener("focus", () => {
        if (dom.searchInput.value.trim().length > 0) {
            fetchAutocomplete(dom.searchInput.value);
        }
    });
}

// Random button
if (dom.randomBtn) {
    dom.randomBtn.addEventListener("click", async () => {
        showLoading();
        try {
            const resp = await fetch("/api/random?rated=true");
            const data = await resp.json();
            hideLoading();
            if (data.results && data.results.length > 0) {
                const anime = data.results[0];
                dom.resultsSection.classList.remove("hidden");
                dom.resultsHeading.textContent = "🎲 Random Pick — How about this one?";
                dom.resultsGrid.innerHTML = "";
                dom.resultsGrid.appendChild(buildAnimeCard(anime));
                dom.messageBox.classList.add("hidden");
            }
        } catch (err) {
            hideLoading();
            showMessage("💥", "Failed to get random anime.");
        }
    });
}

// Close autocomplete on outside click
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-input-wrap") && !e.target.closest(".autocomplete-dropdown")) {
        dom.autocomplete.classList.remove("active");
    }
});
