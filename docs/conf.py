project = "AiiDA"
author = "The AiiDA team."
copyright = (
    "2022, EPFL, "
    "Theory and Simulation of Materials (THEOS) and "
    "National Centre for Computational Design and Discovery of Novel Materials (NCCR MARVEL). "
    "All rights reserved"
)

extensions = ["myst_parser", "ablog", "sphinx.ext.intersphinx"]

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
    "external_links": [
        {"name": "Docs ", "url": "https://aiida-core.readthedocs.io"},
        {"name": "Tutorials ", "url": "https://aiida-tutorials.readthedocs.io"},
        {"name": "Plugins ", "url": "https://aiidateam.github.io/aiida-registry"},
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
        "theme-switcher.html",
        "search-field.html",
        "navbar-icon-links.html",
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
linkcheck_ignore = [
    r"https://www.youtube.com/.*",
]
