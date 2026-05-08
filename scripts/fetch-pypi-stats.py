#!/usr/bin/env python3
"""Fetch monthly PyPI download stats for aiida-core.

Run: python scripts/fetch-pypi-stats.py
Output: src/data/pypi-stats.json (gitignored — generated fresh on every build)

Wired into:
  - `npm run prebuild` — always re-fetches before every build (deploy, CI).
  - `npm run predev`  — re-fetches only when any of the three data files is
                        missing (first clone). Subsequent `npm run dev` is
                        instant; refresh manually with `npm run fetch-data`.

Build/dev fails loudly if pypistats.org is unreachable or returns zero
downloads — there is deliberately no graceful fallback to stale data.
Expected output schema: src/data/pypi-stats.example.json.
"""
import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://pypistats.org/api/packages/aiida-core/overall"

def fetch_stats():
    """Fetch last-month download stats from pypistats API."""
    req = urllib.request.Request(
        f"{API}?period=month&last_month=true",
        headers={"User-Agent": "aiida-website-build"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())

    # Filter for "without_mirrors" (cleaner stat) from the last 30 days
    today = datetime.now(timezone.utc).date()
    cutoff = today - timedelta(days=30)

    monthly_total = 0
    dates = []
    for entry in data["data"]:
        if entry["category"] != "without_mirrors":
            continue
        entry_date = datetime.strptime(entry["date"], "%Y-%m-%d").date()
        if entry_date >= cutoff:
            monthly_total += entry["downloads"]
            dates.append(entry["date"])

    # Round to nearest thousand for display
    if monthly_total >= 1000:
        display = f"{monthly_total // 1000}k+"
    else:
        display = str(monthly_total)

    result = {
        "monthly_downloads": monthly_total,
        "monthly_display": display,
        "period_start": min(dates) if dates else str(cutoff),
        "period_end": max(dates) if dates else str(today),
        "fetched_at": today.isoformat(),
        "package": "aiida-core",
    }

    if monthly_total <= 0:
        raise RuntimeError("pypistats returned zero downloads — refusing to overwrite with empty data.")

    out_path = Path(__file__).resolve().parent.parent / "src" / "data" / "pypi-stats.json"
    out_path.write_text(json.dumps(result, indent=2) + "\n")
    print(f"PyPI stats: {display} downloads/month ({result['period_start']} to {result['period_end']})")
    return result

if __name__ == "__main__":
    try:
        fetch_stats()
    except Exception as e:
        print(f"fetch-pypi-stats: {e}", file=sys.stderr)
        sys.exit(1)
