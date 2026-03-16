"""Add CSS selectively to pages"""

from sphinx.application import Sphinx


def setup(app: Sphinx):
    """Setup the AiiDA Sphinx extension."""
    app.connect("html-page-context", add_css)


def add_css(app: Sphinx, pagename: str, *args, **kwargs) -> None:
    """Add CSS selectively to pages."""
    if app.env is None or app.builder is None or app.builder.format != "html":
        return
    if pagename == "index":
        app.add_css_file("frontpage.css")
