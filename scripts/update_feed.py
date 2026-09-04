#!/usr/bin/env python3
"""Refresh the curated signal data from public RSS feeds.

This intentionally keeps event dates curated in data/events.json: conference
organizers often change virtual access details without publishing a feed.
"""
import html, json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "updates.json"
SOURCES = [
    ("DeepLearning.AI", "https://www.deeplearning.ai/the-batch/feed/"),
    ("Hugging Face", "https://huggingface.co/blog/feed.xml"),
    ("Google DeepMind", "https://deepmind.google/blog/rss.xml"),
]

def clean(value):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", value or "")).strip()

def read_source(name, url):
    request = urllib.request.Request(url, headers={"User-Agent": "AI-Signal-Desk/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        root = ET.fromstring(response.read())
    items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    results = []
    for item in items[:3]:
        title = item.findtext("title") or item.findtext("{http://www.w3.org/2005/Atom}title")
        summary = item.findtext("description") or item.findtext("{http://www.w3.org/2005/Atom}summary")
        if title:
            results.append({"source": name.upper(), "date": datetime.now(timezone.utc).strftime("%d %b %Y").upper(), "title": clean(title), "summary": clean(summary)[:180]})
    return results

def write_event_feed():
    events = json.loads((ROOT / "data" / "events.json").read_text())
    xml_items = "".join(
        f'<item><title>{html.escape(event["title"])}</title>'
        f'<link>{html.escape(event.get("registrationUrl", event["url"]))}</link>'
        f'<guid isPermaLink="false">{html.escape(event["id"])}</guid>'
        f'<description>{html.escape(event["date"] + " · " + event["access"] + " · " + event["description"])}</description></item>'
        for event in sorted(events, key=lambda item: (-item.get("score", 0), item["date"]))
    )
    feed = f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>AI Signal Desk — Ranked AI events</title><link>https://example.com/ai-signal-desk</link><description>Notable AI conferences ranked for architects and developers.</description>{xml_items}</channel></rss>\n'
    (ROOT / "feed.xml").write_text(feed)

def main():
    if "--feed-only" in sys.argv:
        write_event_feed()
        print("Refreshed ranked event RSS feed")
        return
    items = []
    for source in SOURCES:
        try: items.extend(read_source(*source))
        except Exception as error: print(f"Skipped {source[0]}: {error}")
    if not items:
        raise SystemExit("No feeds could be refreshed")
    TARGET.write_text(json.dumps(items[:9], indent=2) + "\n")
    write_event_feed()
    print(f"Wrote {len(items[:9])} signals to {TARGET}")

if __name__ == "__main__": main()
