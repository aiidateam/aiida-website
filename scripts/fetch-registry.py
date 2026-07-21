#!/usr/bin/env python3
"""Fetch the AiiDA plugin registry metadata.

Run: python3 scripts/fetch-registry.py
Output: src/data/plugins_metadata.json (gitignored — generated fresh on every build)

Pulls the pre-built metadata from the upstream aiida-registry, which
runs its own daily cron to scrape PyPI, parse pyproject.toml/setup.cfg,
test installation, and emit JSON. We just consume that artefact so this
site stays a thin presentation layer over the canonical registry.

Wired into:
  - `npm run prebuild` — always re-fetches before every build (deploy, CI).
  - `npm run predev`  — re-fetches only when any of the three data files is
                        missing (first clone). Subsequent `npm run dev` is
                        instant; refresh manually with `npm run fetch-data`.

For nightly freshness in production, a Cloudflare Pages deploy hook re-triggers
the build, which re-runs prebuild. Build/dev fails loudly if upstream is
unreachable or the schema drifts — there is deliberately no graceful fallback
to stale data. Expected output schema: src/data/plugins_metadata.example.json.
"""
import json
import sys
import urllib.request
from pathlib import Path

UPSTREAM = "https://aiidateam.github.io/aiida-registry/plugins_metadata.json"
TIMEOUT_SEC = 30


def fetch():
    req = urllib.request.Request(UPSTREAM, headers={"User-Agent": "aiida-website-build"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as resp:
        raw = resp.read()
    data = json.loads(raw.decode())

    expected = {"plugins", "globalsummary", "status_dict", "entrypointtypes"}
    missing = expected - set(data.keys())
    if missing:
        raise RuntimeError(f"upstream JSON missing keys: {missing}")
    if not data["plugins"]:
        raise RuntimeError("upstream JSON contains zero plugins — refusing to overwrite with empty data.")

    out_path = Path(__file__).resolve().parent.parent / "src" / "data" / "plugins_metadata.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, indent=2) + "\n")

    n_plugins = len(data["plugins"])
    size_kb = len(raw) // 1024
    print(f"Plugin registry: {n_plugins} plugins, {size_kb} KB")


if __name__ == "__main__":
    try:
        fetch()
    except Exception as e:
        print(f"fetch-registry: {e}", file=sys.stderr)
        sys.exit(1)
