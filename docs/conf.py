import sys
from datetime import date
from os import path

project = "AiiDA"
author = "The AiiDA team."
copyright = f"2012-{date.today().year} AiiDA. All Rights Reserved"

extensions = [
    "myst_parser",
    "ablog",
    "sphinx.ext.intersphinx",
    "sphinx_subfigure",
    "notfound.extension",
    "legacy_redirects",
    "ablog_plus",
]

# see https://myst-parser.readthedocs.io
myst_enable_extensions = ["colon_fence"]
myst_substitutions = {"aiida": "AiiDA"}

html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
templates_path = ["_templates"]
html_show_sourcelink = False

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
            "icon": "fa-brands fa-square-twitter",
            "type": "fontawesome",
        },
        {
            "name": "Facebook",
            "url": "https://www.facebook.com/aiidateam",
            "icon": "fa-brands fa-square-facebook",
            "type": "fontawesome",
        },
        {
            "name": "GitHub",
            "url": "https://www.github.com/aiidateam/aiida-core",
            "icon": "fa-brands fa-square-github",
            "type": "fontawesome",
        },
    ],
    "show_prev_next": False,
    "navbar_end": [
        "theme-switcher",
        "navbar-icon-links",
    ],
    "footer_items": ["copyright"],
    "use_edit_page_button": False,
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
    "sections/**": ["sbar-aiida", "sidebar-nav-bs"],
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
linkcheck_exclude_documents = [
    # ignore old (pre-2020) blog pages
    r"news/posts/201[0-9].*",
]
linkcheck_ignore = [
    r"https://www.youtube.com/.*",
    r"http://indico.ictp.it/.*",
    r"https://events\.prace-ri\.eu/event/957/overview",
    r"https://events\.prace-ri\.eu/event/709/",
    r"http://pcoss.xmu.edu.cn/workshop/",
    r"https://emmc.eu/",
    r"http://morty.tech",
    r"https://events.prace-ri.eu/event/957/attachments/1116/1988/AiiDA_CINECA_Final_Agenda.pdf",
    r"http://www.max-centre.eu/2017/07/18/prize/",
    r"http://www.max-centre.eu/max-hackathon/",
    r"https://events.prace-ri.eu/event/709",
    r"https://www.cecam.org/wp-content/uploads/2019/04/2019_03_EPFL_materials_science_researcher_software_engineer.pdf",
    r"https://www.swissuniversities.ch/en/organisation/projects-and-programmes/p-5/",
]

# add path to local sphinx extensions
sys.path.append(path.join(path.dirname(path.abspath(__file__)), "extensions"))
