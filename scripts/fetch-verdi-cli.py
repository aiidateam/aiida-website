#!/usr/bin/env python3
"""Generate verdi CLI tree from aiida-core for the website.

Run: python scripts/fetch-verdi-cli.py
Output: src/data/verdi-cli.json

- Developer mode: uses locally installed aiida-core
- CI / deploy: fetches the latest stable release from PyPI automatically

This only needs to be re-run when aiida-core updates its CLI.
The generated JSON is committed to the repo and imported statically.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import venv
from pathlib import Path

OUT_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "verdi-cli.json"


def generate():
    """Import aiida-core and walk the verdi CLI tree."""
    import click
    from aiida.cmdline.commands.cmd_verdi import verdi
    print("Using local aiida-core installation for CLI generation.")

    def walk_group(group: click.MultiCommand, prefix: str = "verdi") -> dict:
        commands = []
        subcommands = {}
        help_texts = {}

        for name in sorted(group.list_commands(None) or []):
            full = f"{prefix} {name}"
            commands.append(full)
            cmd = group.get_command(None, name)
            if cmd is None:
                continue

            help_texts[full] = (cmd.get_short_help_str(limit=120) or "").strip()

            if isinstance(cmd, click.MultiCommand):
                subs = sorted(cmd.list_commands(None) or [])
                subcommands[full] = subs
                child = walk_group(cmd, full)
                commands.extend(child["commands"])
                subcommands.update(child["subcommands"])
                help_texts.update(child["help"])

        return {"commands": commands, "subcommands": subcommands, "help": help_texts}

    tree = walk_group(verdi)

    output = {
        "commands": sorted(set(tree["commands"])),
        "subcommands": tree["subcommands"],
        "help": tree["help"],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
    print(f"Generated {OUT_PATH} with {len(output['commands'])} commands, {len(output['subcommands'])} groups")


def fetch_and_generate():
    """Create a temp venv, install aiida-core, and re-run this script inside it."""
    tmpdir = tempfile.mkdtemp(prefix="aiida-cli-")
    try:
        print(f"aiida-core not found locally. Fetching latest stable release...")
        venv_dir = os.path.join(tmpdir, "venv")
        venv.create(venv_dir, with_pip=True)

        if sys.platform == "win32":
            pip = os.path.join(venv_dir, "Scripts", "pip")
            python = os.path.join(venv_dir, "Scripts", "python")
        else:
            pip = os.path.join(venv_dir, "bin", "pip")
            python = os.path.join(venv_dir, "bin", "python")

        print("Installing aiida-core (this may take a minute)...")
        subprocess.check_call(
            [pip, "install", "--quiet", "aiida-core"],
            stdout=subprocess.DEVNULL,
        )
        print("Running CLI generation in temporary environment...")
        subprocess.check_call([python, __file__])
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    try:
        generate()
    except ImportError:
        fetch_and_generate()
