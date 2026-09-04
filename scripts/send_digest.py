#!/usr/bin/env python3
"""Send a lightweight HTML digest using Resend (configured by GitHub secrets)."""
import json, os, urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
events = json.loads((ROOT / "data/events.json").read_text())
updates = json.loads((ROOT / "data/updates.json").read_text())
upcoming = sorted((e for e in events if e["date"] >= date.today().isoformat()), key=lambda event: event.get("score", 0), reverse=True)[:8]
event_html = "".join(f'<li><b>{e["title"]}</b> — {e["date"]} · {e["access"]}<br><a href="{e["url"]}">Official details</a></li>' for e in upcoming)
signal_html = "".join(f'<li><b>{u["title"]}</b> — {u["summary"]}</li>' for u in updates[:4])
payload = {"from": os.environ["DIGEST_FROM"], "to": [os.environ["DIGEST_TO"]], "subject": "Your monthly AI Signal Desk brief", "html": f'<h1>AI Signal Desk</h1><p>Here are the next events and signals worth your time.</p><h2>Upcoming</h2><ul>{event_html}</ul><h2>Signals</h2><ul>{signal_html}</ul>'}
request = urllib.request.Request("https://api.resend.com/emails", data=json.dumps(payload).encode(), headers={"Authorization": f'Bearer {os.environ["RESEND_API_KEY"]}', "Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(request, timeout=30) as response: print(response.read().decode())
