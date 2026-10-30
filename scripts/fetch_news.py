import json
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from urllib.parse import urlparse
import feedparser
FEEDS = [
    ("https://www.dizifilmdergisiturkiye.com/rss/sinema.xml", "tr", "Türk Sineması"),
    ("https://www.dizifilmdergisiturkiye.com/rss/diziler.xml", "trseries", "Türk Dizileri"),
    ("https://www.dizifilmdergisiturkiye.com/rss/fragman.xml", "trailers", "Fragmanlar"),
    ("https://www.dizifilmdergisiturkiye.com/rss/gundem.xml", "tr", "Sektör Gündemi"),
    ("https://www.beyazperde.com/rss/haberler.xml", "tr", "Beyazperde"),
    ("https://altyazi.net/feed/", "tr", "Altyazı"),
    ("https://variety.com/feed/", "world", "Variety"),
    ("https://variety.com/v/tv/feed/", "series", "Yabancı Diziler"),
    ("https://deadline.com/feed/rss/", "world", "Deadline"),
    ("https://www.hollywoodreporter.com/feed/", "world", "The Hollywood Reporter"),
]
MAX_ITEMS = 120
def clean_html(value):
    value = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", value or "", flags=re.I | re.S)
    value = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", value or "", flags=re.I | re.S)
    return re.sub(r"\s+", " ", unescape(value)).strip()
def image_for(entry):
    for key in ("media_content", "media_thumbnail"):
        values = entry.get(key) or []
        if values and values[0].get("url"):
            return values[0]["url"]
    for link in entry.get("links", []):
        if link.get("type", "").startswith("image/") and link.get("href"):
            return link["href"]
    html = entry.get("summary", "") or entry.get("description", "")
    return ""
def published_for(entry):
    value = entry.get("published") or entry.get("updated") or ""
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        from time import mktime
        return datetime.fromtimestamp(mktime(parsed), timezone.utc).isoformat()
    try:
        dt = parsedate_to_datetime(value)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()
items, seen = [], set()
for feed_url, category, label in FEEDS:
    try:
        feed = feedparser.parse(feed_url)
        source = clean_html(feed.feed.get("title", "")) or label
        for entry in feed.entries[:35]:
            title = clean_html(entry.get("title", ""))
            link = entry.get("link", "")
            if not title or not link or link in seen:
                continue
            parsed = urlparse(link)
            if parsed.scheme not in ("http", "https"):
                continue
            seen.add(link)
            summary = clean_html(entry.get("summary", "") or entry.get("description", ""))
            items.append({
                "title": title[:240],
                "link": link,
                "summary": summary[:420],
                "image": image_for(entry),
                "published": published_for(entry),
                "source": source[:80],
                "category": category,
                "categoryLabel": label,
            })
    except Exception as exc:
        print(f"Feed okunamadı: {feed_url}: {exc}")
items.sort(key=lambda item: item["published"], reverse=True)
payload = {"updatedAt": datetime.now(timezone.utc).isoformat(), "items": items[:MAX_ITEMS]}
with open("data/news.json", "w", encoding="utf-8") as output:
    json.dump(payload, output, ensure_ascii=False, indent=2)
print(f"{len(payload['items'])} haber kaydedildi.")