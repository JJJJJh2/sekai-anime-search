"""
Anime Finder — Utility Helpers
Data loading, search matching, pinyin support, and recommendation algorithms.
"""

import json
import re
import random
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Paths — resolve relative to this file's location
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ANIME_PATH = DATA_DIR / "anime.json"
STUDIOS_PATH = DATA_DIR / "studios.json"
CHARACTERS_PATH = DATA_DIR / "characters.json"


# ---------------------------------------------------------------------------
# Lazy-load data (loaded once on first access)
# ---------------------------------------------------------------------------
_anime_cache: Optional[list[dict]] = None
_studio_cache: Optional[list[dict]] = None
_character_cache: Optional[list[dict]] = None


def load_anime() -> list[dict]:
    """
    Load anime dataset from split JSON files, caching in memory.

    Loads all data/anime_part*.json files and merges them into a single
    sorted list. Falls back to data/anime.json if no part files exist.
    """
    global _anime_cache
    if _anime_cache is None:
        # Discover all anime_part*.json files (e.g., anime_part1.json, anime_part2.json, ...)
        part_files = sorted(DATA_DIR.glob("anime_part*.json"))

        if part_files:
            # Merge all part files into one list
            merged: list[dict] = []
            seen_ids: set[int] = set()
            for part_file in part_files:
                with part_file.open("r", encoding="utf-8") as f:
                    entries = json.load(f)
                for entry in entries:
                    eid = entry.get("id")
                    if eid in seen_ids:
                        # Duplicate ID across files — skip with warning
                        print(f"  [WARN] Duplicate anime ID {eid} in {part_file.name}, skipping.")
                        continue
                    seen_ids.add(eid)
                    merged.append(entry)
            # Sort by ID for consistent ordering
            merged.sort(key=lambda a: a.get("id", 0))
            _anime_cache = merged
        else:
            # Fallback to single anime.json for backward compatibility
            with ANIME_PATH.open("r", encoding="utf-8") as f:
                _anime_cache = json.load(f)
    return _anime_cache


def load_studios() -> list[dict]:
    """Load studio dataset from JSON, caching in memory."""
    global _studio_cache
    if _studio_cache is None:
        with STUDIOS_PATH.open("r", encoding="utf-8") as f:
            _studio_cache = json.load(f)
    return _studio_cache


def load_characters() -> list[dict]:
    """Load character dataset from JSON, caching in memory."""
    global _character_cache
    if _character_cache is None:
        with CHARACTERS_PATH.open("r", encoding="utf-8") as f:
            _character_cache = json.load(f)
    return _character_cache


def reload_data():
    """Force reload all cached data (useful after data edits)."""
    global _anime_cache, _studio_cache, _character_cache
    _anime_cache = None
    _studio_cache = None
    _character_cache = None


# ---------------------------------------------------------------------------
# Pinyin Mapping — common Chinese characters found in anime titles
# Covers enough characters for fuzzy pinyin search without external deps.
# ---------------------------------------------------------------------------
PINYIN_MAP: dict[str, str] = {
    # Common anime title characters
    '进': 'jin', '击': 'ji', '的': 'de', '巨': 'ju', '人': 'ren',
    '鬼': 'gui', '灭': 'mie', '之': 'zhi', '刃': 'ren',
    '咒': 'zhou', '术': 'shu', '回': 'hui', '战': 'zhan',
    '孤': 'gu', '独': 'du', '摇': 'yao', '滚': 'gun',
    '轻': 'qing', '音': 'yin', '少': 'shao', '女': 'nv',
    '命': 'ming', '运': 'yun', '石': 'shi', '门': 'men',
    '葬': 'zang', '送': 'song', '芙': 'fu', '莉': 'li', '莲': 'lian',
    '刀': 'dao', '剑': 'jian', '神': 'shen', '域': 'yu',
    '你': 'ni', '名': 'ming', '字': 'zi',
    '钢': 'gang', '铁': 'tie', '炼': 'lian', '金': 'jin',
    '魔': 'mo', '法': 'fa', '使': 'shi',
    '火': 'huo', '影': 'ying', '忍': 'ren', '者': 'zhe',
    '海': 'hai', '贼': 'zei', '王': 'wang',
    '死': 'si', '亡': 'wang', '笔': 'bi', '记': 'ji',
    '间': 'jian', '谍': 'die', '家': 'jia', '庭': 'ting',
    '紫': 'zi', '罗': 'luo', '兰': 'lan', '永': 'yong', '恒': 'heng',
    '天': 'tian', '使': 'shi', '心': 'xin', '跳': 'tiao',
    '无': 'wu', '头': 'tou', '骑': 'qi', '士': 'shi',
    '凉': 'liang', '宫': 'gong', '春': 'chun', '日': 'ri',
    '冰': 'bing', '菓': 'guo', '可': 'ke', '爱': 'ai',
    '吹': 'chui', '响': 'xiang', '上': 'shang', '低': 'di',
    '新': 'xin', '世': 'shi', '纪': 'ji', '福': 'fu',
    '约': 'yue', '会': 'hui', '大': 'da', '作': 'zuo',
    '灵': 'ling', '能': 'neng', '百': 'bai', '分': 'fen',
    '黑': 'hei', '执': 'zhi', '事': 'shi', '蓝': 'lan',
    '文': 'wen', '豪': 'hao', '野': 'ye', '犬': 'quan',
    '辉': 'hui', '夜': 'ye', '公': 'gong', '主': 'zhu',
    '未': 'wei', '闻': 'wen', '花': 'hua', '彼': 'bi',
    '男': 'nan', '高': 'gao', '中': 'zhong', '生': 'sheng',
    '学': 'xue', '园': 'yuan', '默': 'mo', '示': 'shi', '录': 'lu',
    '物': 'wu', '语': 'yu', '系': 'xi', '列': 'lie',
    '超': 'chao', '科': 'ke', '学': 'xue', '电': 'dian', '磁': 'ci',
    '哥': 'ge', '布': 'bu', '林': 'lin', '杀': 'sha',
    '彼': 'bi', '岸': 'an', '奇': 'qi', '幻': 'huan',
    '迷': 'mi', '宫': 'gong', '饭': 'fan',
    '铃': 'ling', '芽': 'ya', '旅': 'lv', '途': 'tu',
    '葬': 'zang', '礼': 'li',
    '机': 'ji', '动': 'dong', '队': 'dui',
    '枪': 'qiang', '墓': 'mu',
    '阿': 'a', '基': 'ji', '拉': 'la',
    '龙': 'long', '珠': 'zhu',
    '灌': 'guan', '篮': 'lan',
    '犬': 'quan', '夜': 'ye', '叉': 'cha',
    '乱': 'luan', '马': 'ma',
    '福': 'fu', '星': 'xing',
    '幽': 'you', '游': 'you', '白': 'bai',
    '浪': 'lang', '客': 'ke', '心': 'xin',
    '星': 'xing', '际': 'ji', '牛': 'niu', '仔': 'zai',
    '恐': 'kong', '怖': 'bu', '残': 'can',
    '铃': 'ling', '音': 'yin',
    '转': 'zhuan', '生': 'sheng', '史': 'shi', '莱': 'lai',
    '贤': 'xian', '者': 'zhe', '孙': 'sun',
    '药': 'yao', '屋': 'wu',
    '推': 'tui', '理': 'li',
    '暴': 'bao', '食': 'shi',
    '怪': 'guai', '物': 'wu',
    '英': 'ying', '雄': 'xiong',
    '暗': 'an', '影': 'ying',
    '实': 'shi', '力': 'li',
    '至': 'zhi', '尊': 'zun', '骨': 'gu',
    '香': 'xiang', '格': 'ge', '里': 'li', '世': 'shi', '界': 'jie',
    '言': 'yan', '叶': 'ye',
    '声': 'sheng',
}


def _to_pinyin_lower(text: str) -> str:
    """Convert Chinese characters to pinyin. Non-CJK characters pass through."""
    result = []
    for ch in text:
        if ch in PINYIN_MAP:
            result.append(PINYIN_MAP[ch])
        elif '一' <= ch <= '鿿' or '㐀' <= ch <= '䶿':
            # CJK character not in our map — skip it to avoid noise
            pass
        else:
            result.append(ch.lower())
    return ''.join(result)


# ---------------------------------------------------------------------------
# Search Engine
# ---------------------------------------------------------------------------

def search_anime(query: str, limit: int = 50) -> list[dict]:
    """
    Multi-strategy fuzzy search across the anime dataset.

    Matches against:
      1. Chinese name (exact substring)
      2. Japanese name (exact substring)
      3. English name (exact substring)
      4. Aliases (substring match)
      5. Pinyin representation (fuzzy)
      6. Genre tags (substring match)
      7. Synopsis (full-text substring)
      8. Studio name (substring match)

    Results are deduplicated and sorted by relevance score (higher = better).
    """
    anime_list = load_anime()
    q = query.strip().lower()
    if not q:
        return []

    q_pinyin = _to_pinyin_lower(q)  # Pre-compute pinyin of query
    scored: list[tuple[int, dict]] = []

    for anime in anime_list:
        score = 0

        # Build searchable text fields
        cn = anime.get("name_cn", "").lower()
        jp = anime.get("name_jp", "").lower()
        en = anime.get("name_en", "").lower()
        aliases = " ".join(a.lower() for a in anime.get("aliases", []))
        genres = " ".join(g.lower() for g in anime.get("genres", []))
        synopsis = anime.get("synopsis", "").lower()
        studio = anime.get("studio", "").lower()

        # --- Exact / substring matches ---
        # Title matches (highest weight)
        if q in cn:
            score += 50
        if q in jp:
            score += 45
        if q in en:
            score += 45
        if q in aliases:
            score += 40

        # Genre / tag match
        if q in genres:
            score += 25

        # Synopsis match (lower weight, many false positives)
        if q in synopsis:
            score += 5

        # Studio match
        if q in studio:
            score += 20

        # --- Pinyin fuzzy match ---
        # Compare pinyin of query against pinyin of Chinese name
        cn_pinyin = _to_pinyin_lower(cn)
        if q_pinyin and cn_pinyin:
            # Check if pinyin query is a substring of the name's pinyin
            if q_pinyin in cn_pinyin:
                score += 35
            # Check if pinyin query is close to the beginning (prefix-like)
            elif cn_pinyin.startswith(q_pinyin[:max(1, len(q_pinyin) // 2)]):
                score += 10

        # --- Alias pinyin matching ---
        for alias in anime.get("aliases", []):
            alias_pinyin = _to_pinyin_lower(alias.lower())
            if q_pinyin and alias_pinyin and q_pinyin in alias_pinyin:
                score += 20
                break

        # --- Token-based matching (each query word separately) ---
        q_tokens = q.split()
        if len(q_tokens) > 1:
            combined = f"{cn} {jp} {en} {aliases}"
            token_score = sum(8 for t in q_tokens if t in combined)
            score += token_score

        if score > 0:
            scored.append((score, anime))

    # Sort by score descending, take top `limit`
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [item[1] for item in scored[:limit]]


# ---------------------------------------------------------------------------
# Autocomplete / Suggestions
# ---------------------------------------------------------------------------

def autocomplete(query: str, limit: int = 8) -> list[dict]:
    """
    Return top-matching anime titles for typeahead/autocomplete.
    Returns shorter objects with just id, title info, and match type.
    """
    results = search_anime(query, limit=20)
    suggestions = []
    for anime in results[:limit]:
        suggestions.append({
            "id": anime["id"],
            "name_cn": anime.get("name_cn", ""),
            "name_jp": anime.get("name_jp", ""),
            "name_en": anime.get("name_en", ""),
            "genres": anime.get("genres", [])[:3],
            "year": anime.get("year", ""),
        })
    return suggestions


# ---------------------------------------------------------------------------
# Related Anime by Shared Genres
# ---------------------------------------------------------------------------

def get_related(anime_id: int, limit: int = 6) -> list[dict]:
    """Return anime that share at least one genre tag with the given anime."""
    target = _find_by_id(anime_id)
    if target is None:
        return []

    target_genres = set(target.get("genres", []))
    scored = []
    for other in load_anime():
        if other["id"] == anime_id:
            continue
        shared = len(target_genres & set(other.get("genres", [])))
        if shared > 0:
            # Bonus for same studio
            bonus = 1 if other.get("studio") == target.get("studio") else 0
            scored.append((shared + bonus, other))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [item[1] for item in scored[:limit]]


# ---------------------------------------------------------------------------
# "You Might Like" — personalized-ish recommendation
# ---------------------------------------------------------------------------

def you_might_like(anime_id: int, limit: int = 6) -> list[dict]:
    """
    Enhanced recommendation: combines genre overlap, same studio,
    similar year/era, and rating proximity.
    """
    target = _find_by_id(anime_id)
    if target is None:
        return random_recommendations(limit)

    target_genres = set(target.get("genres", []))
    target_year = target.get("year", 2020)
    target_rating = target.get("rating", 7.5)

    scored = []
    for other in load_anime():
        if other["id"] == anime_id:
            continue
        score = 0
        # Genre overlap
        shared = len(target_genres & set(other.get("genres", [])))
        score += shared * 3
        # Same studio
        if other.get("studio") == target.get("studio"):
            score += 5
        # Similar era (±5 years)
        year_diff = abs((other.get("year") or 2020) - target_year)
        if year_diff <= 5:
            score += 2
        # Rating proximity
        rating_diff = abs((other.get("rating") or 7.5) - target_rating)
        if rating_diff <= 0.5:
            score += 2

        if score > 0:
            scored.append((score, other))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [item[1] for item in scored[:limit]]


# ---------------------------------------------------------------------------
# Rankings
# ---------------------------------------------------------------------------

def get_top_anime(limit: int = 20, sort_by: str = "rating") -> list[dict]:
    """
    Return top anime sorted by rating or year.
    sort_by: "rating" | "popularity" | "newest"
    """
    anime_list = load_anime()
    if sort_by == "newest":
        sorted_list = sorted(anime_list, key=lambda a: a.get("year", 0), reverse=True)
    elif sort_by == "popularity":
        sorted_list = sorted(anime_list, key=lambda a: a.get("rank", 999))
    else:
        sorted_list = sorted(anime_list, key=lambda a: a.get("rating", 0), reverse=True)
    return sorted_list[:limit]


def get_top_airing(limit: int = 12) -> list[dict]:
    """Return latest-year anime (simulating 'currently airing')."""
    return get_top_anime(limit=limit, sort_by="newest")


def get_daily_waifu() -> dict:
    """Deterministic 'daily' random character. Seed changes daily."""
    import datetime
    chars = load_characters()
    today = datetime.date.today()
    seed = today.year * 10000 + today.month * 100 + today.day
    rng = random.Random(seed)
    char = rng.choice(chars)
    # Attach their anime info
    anime = _find_by_id(char.get("anime_id", 0))
    result = dict(char)
    if anime:
        result["anime_name"] = anime.get("name_cn", "")
    return result


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def filter_by_genre(genre: str, limit: int = 50) -> list[dict]:
    """Return anime matching a specific genre tag (case-insensitive)."""
    g = genre.strip().lower()
    results = []
    for anime in load_anime():
        if g in [tag.lower() for tag in anime.get("genres", [])]:
            results.append(anime)
        if len(results) >= limit:
            break
    return results


def random_recommendations(limit: int = 6) -> list[dict]:
    """Return random highly-rated anime (rating >= 7.5)."""
    pool = [a for a in load_anime() if a.get("rating", 0) >= 7.5]
    if len(pool) < limit:
        pool = load_anime()
    return random.sample(pool, min(limit, len(pool)))


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _find_by_id(anime_id: int) -> Optional[dict]:
    """Find an anime entry by ID."""
    return next((a for a in load_anime() if a["id"] == anime_id), None)
