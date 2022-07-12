project = "AiiDA"
author = "The AiiDA team."
copyright = (
    "2022, EPFL, "
    "Theory and Simulation of Materials (THEOS) and "
    "National Centre for Computational Design and Discovery of Novel Materials (NCCR MARVEL). "
    "All rights reserved"
)

import pydata_sphinx_theme

extensions = ["myst_parser", "ablog", "sphinx.ext.intersphinx", "sphinx_subfigure"]

myst_enable_extensions = ["colon_fence"]

html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
templates_path = ["_templates"]

# see https://pydata-sphinx-theme.readthedocs.io
html_theme_options = {
    "logo": {
        "image_light": "logo-light.svg",
        "image_dark": "logo-dark.svg",
    },
    "favicons": [
        {
            "rel": "icon",
            "sizes": "16x16",
            "href": "favicon-16x16.png",
        },
        {
            "rel": "icon",
            "sizes": "32x32",
            "href": "favicon-32x32.png",
        },
    ],
    "icon_links": [
        {
            "name": "Twitter",
            "url": "https://twitter.com/aiidateam",
            "icon": "fab fa-twitter-square",
            "type": "fontawesome",
        },
        {
            "name": "Facebook",
            "url": "https://www.facebook.com/aiidateam",
            "icon": "fab fa-facebook-square",
            "type": "fontawesome",
        },
        {
            "name": "GitHub",
            "url": "https://www.github.com/aiidateam/aiida-core",
            "icon": "fab fa-github-square",
            "type": "fontawesome",
        },
    ],
    "show_prev_next": False,
    "navbar_end": [
        "search-button",
        "theme-switcher",
        "navbar-icon-links",
    ],
    "footer_items": ["copyright"],
    "use_edit_page_button": True,
    "search_bar_text": "Search ...",
}

html_context = {
    "default_mode": "auto",
    "github_user": "aiidateam",
    "github_repo": "aiida-website",
    "github_version": "main",
    "doc_path": "docs/",
}

html_sidebars = {
    "index": ["sbar-aiida"],
    "*": ["sbar-aiida", "sidebar-nav-bs"],
    "team/**": ["sbar-aiida", "sidebar-nav-bs"],
    "more/**": ["sbar-aiida", "sidebar-nav-bs"],
    "news/index": [
        "recentposts",
        "tagcloud",
        "categories",
        "archives",
    ],
    "news/index/**": [
        "recentposts",
        "tagcloud",
        "categories",
        "archives",
    ],
    "news/posts/*": [
        "postcard",
        "recentposts",
        "tagcloud",
        "categories",
        "archives",
    ],
}

# https://ablog.readthedocs.io/
blog_path = "news/index"
blog_title = "News and Events"
blog_authors = {"AiiDA": ("The AiiDA team", "developers@aiida.net")}
blog_default_author = "AiiDA"
fontawesome_included = True

# linkcheck
linkcheck_exclude_documents = []
linkcheck_ignore = [
    r"https://www.youtube.com/.*",
    r"http://indico.ictp.it/.*",
    r"https://events\.prace-ri\.eu/event/957/overview",
    r"https://events\.prace-ri\.eu/event/709/",
    r"http://pcoss.xmu.edu.cn/workshop/",
    r"https://emmc.eu/",
    r"http://morty.tech",
    r"https://events.prace-ri.eu/event/957/attachments/1116/1988/AiiDA_CINECA_Final_Agenda.pdf",
]


# ablog custom code

from datetime import datetime
from string import Formatter

from ablog.blog import Blog, revise_pending_xrefs
from ablog.post import _missing_reference
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.application import Sphinx
from sphinx.locale import _ as translate
from sphinx.util.docutils import SphinxDirective


class UpcomingEventListDirective(SphinxDirective):
    """Handle the ``upcominglist`` directive."""

    option_spec = {
        "format": lambda a: a.strip(),
        "date": lambda a: a.strip(),
        "sort": directives.flag,
        "excerpts": directives.flag,
        "list-style": lambda a: a.strip(),
        "expand": directives.unchanged,
    }

    def run(self):
        node = nodes.Element()
        node["is_event_list"] = True
        node["format"] = self.options.get("format", "{date} - {title}")
        node["date"] = self.options.get("date", None)
        node["sort"] = "sort" in self.options
        node["excerpts"] = "excerpts" in self.options
        node["list-style"] = self.options.get("list-style", "none")
        node["expand"] = self.options.get("expand", "Read more ...")
        return [node]


def process_upcominglist(app, doctree, docname):
    """Replace `EventList` nodes with lists of event posts.

    This is adapted from the `ablog.post.process_postlist` function,
    but only processes drafts (posts with a future date) and the ``Events`` category.
    """
    blog = Blog(app)

    for node in doctree.traverse(nodes.Element):
        if "is_event_list" not in node:
            continue

        posts = [
            post for post in blog.drafts if "Events" in [c.name for c in post.category]
        ]
        posts.sort(reverse=True)

        if not posts:
            emp = nodes.emphasis()
            emp.append(nodes.Text("More events coming soon!"))
            node.replace_self(emp)
            continue

        if node.attributes["sort"]:
            posts.sort()  # in reverse chronological order, so no reverse=True

        fmts = list(Formatter().parse(node.attributes["format"]))
        not_in = {
            "date",
            "title",
            "author",
            "location",
            "language",
            "category",
            "tags",
            None,
        }
        for text, key, __, __ in fmts:
            if key not in not_in:
                raise KeyError(f"{key} is not recognized in `upcominglist` format")

        excerpts = node.attributes["excerpts"]
        expand = node.attributes["expand"]
        date_format = node.attributes["date"] or translate(blog.post_date_format_short)
        bl = nodes.bullet_list()
        bl.attributes["classes"].append("postlist-style-" + node["list-style"])
        bl.attributes["classes"].append("postlist")

        for post in posts:
            bli = nodes.list_item()
            bli.attributes["classes"].append("ablog-post")
            bl.append(bli)
            par = nodes.paragraph()
            bli.append(par)

            for text, key, __, __ in fmts:
                if text:
                    par.append(nodes.Text(text))
                if key is None:
                    continue
                if key == "date":
                    par.append(nodes.Text(post.date.strftime(date_format)))
                else:
                    items = [post] if key == "title" else getattr(post, key)
                    for i, item in enumerate(items, start=1):
                        if key == "title":
                            ref = nodes.reference()
                            ref["refuri"] = app.builder.get_relative_uri(
                                docname, item.docname
                            )
                            for key in (
                                "ids",
                                "backrefs",
                                "dupnames",
                                "classes",
                                "names",
                            ):
                                ref[key] = []
                            ref["internal"] = True
                            ref.append(nodes.Text(str(item)))
                            par.attributes["classes"].append("ablog-post-title")
                        else:
                            ref = _missing_reference(app, item.xref, docname)
                        par.append(ref)
                        if i < len(items):
                            par.append(nodes.Text(", "))

            if excerpts and post.excerpt:
                for enode in post.excerpt:
                    enode = enode.deepcopy()
                    enode.attributes["classes"].append("ablog-post-excerpt")
                    revise_pending_xrefs(enode, docname)
                    app.env.resolve_references(enode, docname, app.builder)
                    enode.parent = bli.parent
                    bli.append(enode)
                if expand:
                    ref = app.builder.get_relative_uri(docname, post.docname)
                    enode = nodes.paragraph()
                    enode.attributes["classes"].append("ablog-post-expand")
                    refnode = nodes.reference("", "", internal=True, refuri=ref)
                    innernode = nodes.emphasis(text=expand)
                    refnode.append(innernode)
                    enode.append(refnode)
                    bli.append(enode)

        node.replace_self(bl)


def setup(app: Sphinx):
    """Setup the AiiDA Sphinx extension."""
    app.add_directive("upcominglist", UpcomingEventListDirective)
    # make this 1 greater than the default priority that process_postlist uses
    app.connect("doctree-resolved", process_upcominglist, priority=501)
