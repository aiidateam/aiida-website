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
    "sphinx_design",
    "sphinx_subfigure",
    "sphinx_timeline",
    "notfound.extension",
    "legacy_redirects",
    "check_events",
    "selective_css",
    "sphinx_favicon",
]

# see https://myst-parser.readthedocs.io
myst_enable_extensions = ["colon_fence"]
myst_substitutions = {"aiida": "AiiDA"}

html_theme = "pydata_sphinx_theme"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
templates_path = ["_templates"]
html_show_sourcelink = False

# sphinx_favicon
favicons = [
    "favicon-16x16.png",
    "favicon-32x32.png",
]

# see https://pydata-sphinx-theme.readthedocs.io
html_theme_options = {
    # "announcement": "Welcome to the new AiiDA site!",
    "logo": {
        "image_light": "logo-light.svg",
        "image_dark": "logo-dark.svg",
    },
    "icon_links": [
        {
            "name": "Discourse",
            "url": "https://aiida.discourse.group",
            "icon": "fa-brands fa-discourse",
            "type": "fontawesome",
        },
        {
            "name": "GitHub",
            "url": "https://www.github.com/aiidateam/aiida-core",
            "icon": "fa-brands fa-square-github",
            "type": "fontawesome",
        },
        {
            "name": "Twitter",
            "url": "https://twitter.com/aiidateam",
            "icon": "fa-brands fa-square-x-twitter",
            "type": "fontawesome",
        },
    ],
    "header_links_before_dropdown": 6,
    "show_prev_next": False,
    "navbar_end": [
        "theme-switcher",
        "navbar-icon-links",
    ],
    "footer_start": ["copyright"],
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
    "index": [],
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

# https://sphinx-notfound-page.readthedocs.io/e
notfound_urls_prefix = "/"

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
    r"https://www.cineca.it/.*",
    r"https://events.prace-ri.eu/event/957/overview",
    r"https://events.prace-ri.eu/event/709/",
    r"http://pcoss.xmu.edu.cn/workshop/",
    r"https://emmc.eu/",
    r"http://morty.tech",
    r"https://events.prace-ri.eu/event/957/attachments/1116/1988/AiiDA_CINECA_Final_Agenda.pdf",
    r"http://www.max-centre.eu/2017/07/18/prize/",
    r"http://www.max-centre.eu/max-hackathon/",
    r"https://events.prace-ri.eu/event/709",
    r"https://www.cecam.org/wp-content/uploads/2019/04/2019_03_EPFL_materials_science_researcher_software_engineer.pdf",
    r"https://www.swissuniversities.ch/en/organisation/projects-and-programmes/p-5/",
    r"http://www.wannier.org/events/school-oxford-2020/",
    r"http://doi.org/.*",
    r"https://doi.org/.*",
    r"https://onlinelibrary.wiley.com/doi/.*",
    r"https://aip.scitation.org/doi/.*",
    r"https://pubs.acs.org/doi/.*",
    r"https://www.sciencedirect.com/science/.*",
    r"http://dx.doi.org/10.5075/epfl-thesis-7179",  # EPFL blocks repeating requests
    r"http://qe2019.ijs.si/index.html",  # event page does not exist anymore
    r"http://opensource.org/licenses/MIT",
    r"https://opensource.org/licenses/MIT",
    r"https://www.facebook.com/.*",
    r"https://github.com/aiidateam/aiida-core/discussions/.*",  # has been archived
    r"https://github.com/orgs/aiidateam/discussions",  # has been archived
    r"https://news.microsoft.com/azure-quantum-june-event",  #  Requires human-verification
    r"https://scholar.google.com/scholar?cites=10268089832296963062&as_sdt=2005&sciodt=0,5&hl=en",  # Also stopped working
    r"http://hdl.handle.net/2262/91467",
    r"https://www.tara.tcd.ie/handle/2262/91467",
    r"https://scholar.google.com/scholar?cites=10268089832296963062&amp;as_sdt=2005&amp;sciodt=0,5&amp;hl=en",
]

aiida_ignore_event_checks = [
    "news/posts/2015-11-09-aiida-tutorial-in-november",
    "news/posts/2016-01-19-tutorial-on-high-throughput",
    "news/posts/2016-03-02-photos-of-the-aiida",
    "news/posts/2016-05-13-aiida-tutorial-for-users",
    "news/posts/2016-06-09-aiida-tutorial-june-2016",
    "news/posts/2016-06-23-news-from-the-aiida",
    "news/posts/2016-09-01-aiida-tutorial-ictp-jan2017",
    "news/posts/2017-01-09-new-aiida-tutorial-in",
    "news/posts/2017-01-25-photos-from-the-aiida",
    "news/posts/2017-06-21-summary-report-of-the",
    "news/posts/2018-04-16-aiida-tutorial-at-cineca",
    "news/posts/2018-06-01-photos-from-the-prace",
    "news/posts/2018-06-07-max-hackathon-july-2018",
    "news/posts/2020-01-22-hackathon-announcement",
    "news/posts/2020-03-03-hackathon-notes",
    "news/posts/2020-03-06-aiida-tutorial-@-vilnius",
    "news/posts/2020-05-28-aiida-tutorial-at-vilnius",
    "news/posts/2022-07-13-scipy-talk",
]

# add path to local sphinx extensions
sys.path.append(path.join(path.dirname(path.abspath(__file__)), "extensions"))
