"""Check events.yaml and blog posts are consistent."""
from __future__ import annotations

from pathlib import Path

from sphinx.application import Sphinx
from sphinx.environment import BuildEnvironment
from sphinx.util import logging
import yaml

LOGGER = logging.getLogger(__name__)


def setup(app: Sphinx):
    """Setup the Sphinx extension."""
    app.add_config_value("aiida_ignore_event_checks", [], "env")
    app.connect("builder-inited", read_events)
    app.connect("env-check-consistency", check_events)


def check_events(app: Sphinx, env: BuildEnvironment):
    """Check all events post are in the events file."""
    for posts in env.ablog_posts.values():
        for post in posts:
            if post["docname"] in env.config.aiida_ignore_event_checks:
                continue
            category: set[str] = post["category"]
            if not category.intersection(("Reports", "News", "Events", "Releases")):
                LOGGER.warning(
                    f"Post does not have a valid category [aiida]",
                    location=post["docname"],
                )
            if "Events" in category and post["docname"] not in env.events_announced:
                LOGGER.warning(
                    f"Events post not in events.yaml [aiida]", location=post["docname"]
                )
            if "Reports" in category and post["docname"] not in env.events_reported:
                LOGGER.warning(
                    f"Reports post not in events.yaml [aiida]", location=post["docname"]
                )


def read_events(app: Sphinx) -> None:
    """Read events from the events file."""
    events_path = Path(app.confdir).joinpath("events.yaml")
    data = yaml.safe_load(events_path.read_text("utf8"))
    try:
        docs_announce, docs_report = _read_data(data, app)
    except Exception as exc:
        raise ValueError(f"Invalid events file: {events_path}: {exc}") from exc
    app.env.events_announced = docs_announce
    app.env.events_reported = docs_report


def _read_data(data, app: Sphinx) -> tuple[set[str], set[str]]:
    """Read the data."""
    if not isinstance(data, list):
        raise ValueError("Events file must contain a list of events")
    docnames = {"announce": set(), "report": set()}
    for i, event in enumerate(data):
        if not isinstance(event, dict):
            raise ValueError(f"Event {i} is not a dictionary")
        for key in ("announce", "report"):
            if key in event:
                docname = str(event[key]).lstrip("/")
                # strip extension
                for suffix in app.config.source_suffix:
                    if docname.endswith(suffix):
                        docname = docname[: -len(suffix)]
                        break
                # check valid docs
                if docname not in app.env.found_docs:
                    raise ValueError(
                        f"Event {i} {key!r} value not a valid doc: {event[key]!r}"
                    )
                event[key] = docname
                docnames[key].add(docname)
    return docnames["announce"], docnames["report"]
