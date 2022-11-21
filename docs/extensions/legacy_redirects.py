"""Create redirects from the old aiida.net site end-points.

The logic works similar to sphinx.rediraffe, but handles adding index.html
for end-points.
"""
import json
from os.path import relpath
from pathlib import Path
from typing import Dict, Optional

from sphinx.application import Sphinx
from sphinx.util import logging

logger = logging.getLogger(__name__)

REDIRECT_TEMPLATE = """
<html>
    <head>
        <noscript>
            <meta http-equiv="refresh" content="0; url={rel_url}"/>
        </noscript>
    </head>
    <body>
        <script>
            window.location.href = '{rel_url}' + (window.location.search || '') + (window.location.hash || '');
        </script>
        <p>You should have been redirected.</p>
        <a href="{rel_url}">If not, click here to continue.</a>
    </body>
</html>
"""


def build_redirects(app: Sphinx, exception: Optional[Exception]) -> None:
    """Build and write redirects."""
    if exception or app.builder.format != "html":
        return
    logger.info("Writing legacy redirects...")

    # read records from previous build, if any
    redirect_json_file = Path(app.outdir) / "_legacy_redirected.json"
    if redirect_json_file.exists():
        redirect_record = json.loads(redirect_json_file.read_text("utf8"))
    else:
        redirect_record: Dict[str, str] = {}

    build_redirect_base = Path(app.outdir)
    redirects: Dict[str, str] = json.loads(
        Path(app.srcdir).joinpath("legacy_redirect.json").read_text()
    )
    for redirect_from, redirect_to in redirects.items():

        # create paths
        if redirect_from.endswith("/"):
            redirect_from = redirect_from + "index.html"
        build_redirect_from = build_redirect_base / redirect_from
        build_redirect_to = build_redirect_base / (redirect_to + ".html")

        # deal with redirect written from previous builds
        if (
            build_redirect_from.exists()
            and build_redirect_from.as_posix() in redirect_record
        ):
            # if it is still pointing to the same source, continue
            if (
                redirect_record[build_redirect_from.as_posix()]
                == build_redirect_to.as_posix()
            ):
                continue
            # otherwise remove and rewrite
            build_redirect_from.unlink()

        # create redirect file
        if build_redirect_from.exists():
            logger.warning(f"redirect-from already exists: {build_redirect_from}")
        if not build_redirect_to.exists():
            logger.warning(f"redirect-to does not exist: {build_redirect_to}")
        build_redirect_from.parent.mkdir(parents=True, exist_ok=True)
        build_redirect_from.write_text(
            REDIRECT_TEMPLATE.format(
                rel_url=relpath(build_redirect_to, build_redirect_from.parent)
            )
        )
        # record for re-builds
        redirect_record[build_redirect_from.as_posix()] = build_redirect_to.as_posix()

    redirect_json_file.write_text(json.dumps(redirect_record), encoding="utf8")


def setup(app: Sphinx):
    """Setup the AiiDA Sphinx extension."""
    app.connect("build-finished", build_redirects)
