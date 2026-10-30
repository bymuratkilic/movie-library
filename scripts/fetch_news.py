import json
import re
import time
import difflib
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
from urllib.parse import urlparse, urlencode
from urllib.request import Request, urlopen
import feedparser

feedparser.USER_AGENT = "Mozilla/5.0 (compatible; PerdeNews/1.0)"

FEEDS = [
    ("https://www.dizifilmdergisiturkiye.com/rss/sinema.xml", "tr", "Türk Sineması"),
    ("https://www.dizifilmdergisiturkiye.com/rss/diziler.xml", "trseries", "Türk Dizileri"),
    ("https://www.dizifilmdergisiturkiye.com/rss/fragman.xml", "trailers", "Fragmanlar"),
    ("https://www.dizifilmdergisiturkiye.com/rss/gundem.xml", "industry", "Sektör Gündemi"),
    ("https://www.beyazperde.com/rss/haberler.xml", "tr", "Beyazperde"),
    ("https://altyazi.net/feed/", "tr", "Altyazı"),
    ("https://variety.com/v/film/feed/", "film", "Variety · Film"),
    ("https://variety.com/v/tv/feed/", "series", "Variety · TV"),
    ("https://deadline.com/v/film/feed/", "film", "Deadline · Film"),
    ("https://deadline.com/v/tv/feed/", "series", "Deadline · TV"),
    ("https://www.hollywoodreporter.com/feed/", "world", "The Hollywood Reporter"),
    ("https://www.indiewire.com/feed/", "world", "IndieWire"),
    ("https://collider.com/feed/", "trailers", "Collider"),
]
MAX_ITEMS = 120
TRANSLATE_CACHE = {}

class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.image = ""
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "img" and not self.image:
            attrs = dict(attrs)
            self.image = attrs.get("src") or attrs.get("data-src") or attrs.get("data-lazy-src") or ""

def clean_html(value):
    value = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", value or "", flags=re.I | re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(value)).strip()

def image_for(entry):
    for key in ("media_content", "media_thumbnail"):
        for item in entry.get(key) or []:
            image = item.get("url")
            if image:
                return image
    for link in entry.get("links", []):
        if link.get("type", "").startswith("image/") and link.get("href"):
            return link["href"]
    parser = ImageParser()
    parser.feed(entry.get("summary", "") or entry.get("description", ""))
    return parser.image

def published_for(entry):
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        from calendar import timegm
        return datetime.fromtimestamp(timegm(parsed), timezone.utc).isoformat()
    value = entry.get("published") or entry.get("updated") or ""
    try:
        dt = parsedate_to_datetime(value)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

def translate_to_turkish(title, summary):
    combined = title + "\n\n---PERDE-SUMMARY---\n\n" + (summary or "")
    if combined in TRANSLATE_CACHE:
        return TRANSLATE_CACHE[combined]
    try:
        query = urlencode({"client": "gtx", "sl": "auto", "tl": "tr", "dt": "t", "q": combined})
        request = Request(
            "https://translate.googleapis.com/translate_a/single?" + query,
            headers={"User-Agent": "Mozilla/5.0 PerdeNews/1.0"}
        )
        with urlopen(request, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
        translated = "".join(part[0] for part in result[0] if part and part[0])
        if "---PERDE-SUMMARY---" in translated:
            translated_title, translated_summary = translated.split("---PERDE-SUMMARY---", 1)
            output = (translated_title.strip(), translated_summary.strip())
        else:
            output = (translated.strip() or title, summary)
        TRANSLATE_CACHE[combined] = output
        time.sleep(0.15)
        return output
    except Exception as exc:
        print("Çeviri yapılamadı; orijinal metin korunuyor:", str(exc)[:160])
        return title, summary

def normalize_title(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9çğıöşü]+", " ", value)
    return " ".join(value.split())

def classify_news(category, title, summary):
    text = (title + " " + summary).lower()
    actor_terms = ("oyuncu", "başrol", "kadrosuna katıldı", "cast", "star joins", "to star", "starring", "actor", "actress")
    if any(term in text for term in actor_terms):
        return "actors"
    if category == "world":
        series_terms = ("season", "series", "tv ", "television", "netflix", "hbo", "disney+", "prime video", "streaming", "dizi")
        return "series" if any(term in text for term in series_terms) else "film"
    return category

def category_name(category):
    return {
        "tr": "Yerli Sinema", "trseries": "Türk Dizileri",
        "film": "Dünya Sineması", "world": "Dünya Gündemi",
        "series": "Yabancı Diziler", "actors": "Oyuncular",
        "industry": "Sektör", "trailers": "Fragmanlar"
    }.get(category, "Sinema")

items, seen_links, seen_titles = [], set(), []
for feed_url, category, label in FEEDS:
    try:
        feed = feedparser.parse(feed_url)
        source = clean_html(feed.feed.get("title", "")) or label
        for entry in feed.entries[:35]:
            original_title = clean_html(entry.get("title", ""))
            link = entry.get("link", "")
            if not original_title or not link:
                continue
            parsed_url = urlparse(link)
            if parsed_url.scheme not in ("http", "https") or link in seen_links:
                continue
            normalized = normalize_title(original_title)
            if any(difflib.SequenceMatcher(None, normalized, old).ratio() > 0.91 for old in seen_titles):
                continue
            seen_links.add(link)
            seen_titles.append(normalized)
            original_summary = clean_html(entry.get("summary", "") or entry.get("description", ""))
            category = classify_news(category, original_title, original_summary)
            title, summary = original_title, original_summary
            translated = False
            if category in ("world", "series", "trailers", "industry"):
                title, summary = translate_to_turkish(original_title, original_summary)
                translated = title != original_title or summary != original_summary
            items.append({
                "title": title[:240],
                "originalTitle": original_title[:240] if translated else "",
                "link": link,
                "summary": summary[:520],
                "originalSummary": original_summary[:520] if translated else "",
                "translated": translated,
                "image": image_for(entry),
                "published": published_for(entry),
                "source": source[:80],
                "category": category,
                "categoryLabel": category_name(category),
            })
    except Exception as exc:
        print(f"Feed okunamadı: {feed_url}: {exc}")

items.sort(key=lambda item: item["published"], reverse=True)
payload = {"updatedAt": datetime.now(timezone.utc).isoformat(), "items": items[:MAX_ITEMS]}
with open("data/news.json", "w", encoding="utf-8") as output:
    json.dump(payload, output, ensure_ascii=False, indent=2)
print(f"{len(payload['items'])} haber kaydedildi.")
