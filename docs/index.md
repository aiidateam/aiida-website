---
html_theme.sidebar_secondary.remove: true
---

```{toctree}
:hidden:
Download <sections/download.md>
Docs <https://aiida-core.readthedocs.io>
Support <sections/mailing_list.md>
Plugins <https://aiidateam.github.io/aiida-registry>
Posts <news/index.md>
About <sections/about.md>
Tutorials <https://aiida-tutorials.readthedocs.io>
sections/team.md
sections/events.md
sections/science.md
sections/testimonials.md
sections/graph_gallery.md
Roadmap <https://github.com/aiidateam/aiida-core/wiki/AiiDA-release-roadmap>
sections/acknowledgements.md
```

# Automated Interactive Infrastructure and Database for Computational Science

:::::{div} section-flex
::::{grid}
:gutter: 2 4 5 5
:margin: 4 4 1 2
:class-container: section-contents

:::{grid-item}
:columns: 12 5 5 5
:child-align: justify
:class: sd-fs-3 sd-text-center

Automated workflows \
for computational science.

```{button-ref} sections/download
:ref-type: doc
:color: primary
:class: sd-px-4 sd-fs-5
Download
```

:::

:::{grid-item}
:columns: 12 7 7 7
:child-align: center

```{raw} html
:file: ./_static/network.svg
```

:::
::::
:::::

:::::{div} section-flex alternate-bg
::::{div} section-contents grid-container grid-sm-2 grid-md-4 grid-lg-4 grid-xl-4
```{raw} html
<a href="sections/about.html#feat-data-provenance" class="grid-item">
<i class="fas fa-project-diagram fa-3x sd-mb-2"></i><br/>
Provenance Tracking
</a>
<a href="sections/about.html#feat-plugin-framework" class="grid-item">
<i class="fas fa-plug fa-3x sd-mb-2"></i><br/>
Plugin Framework
</a>
<a href="sections/about.html#feat-hpc-interface" class="grid-item">
<i class="fas fa-upload fa-3x sd-mb-2"></i><br/>
HPC Interface
</a>
<a href="sections/about.html#feat-open-source" class="grid-item">
<i class="fab fa-osi fa-3x sd-mb-2"></i><br/>
Open Source
</a>
```
::::
:::::

::::{div} section-flex
:::{div} section-contents

<h2 class="front">Events
<a class="headerlink" href="#events" title="Permalink to this heading">#</a>
</h2>

````{timeline}
:events: /events.yaml
:height: 380px

{% if 'report' in e %}
{% set link = e.report %}
{% elif 'announce' in e %}
{% set link = e.announce %}
{% elif 'url' in e %}
{% set link = e.url %}
{% else %}
{% set link = '/sections/events.md' %}
{% endif %}

**{{dtrange}}**\
[*{{e.name | trim | replace(']', '\]')}}*]({{link|trim}})\
*{{e.location | trim}}*

{% if 'description' in e %}
{{e.description}}
{% endif %}

````

:::
::::

::::{div} section-flex alternate-bg
:::{div} section-contents

<h2 class="front">Latest posts
<a class="headerlink" href="#latest-news" title="Permalink to this heading">#</a>
</h2>

```{postlist} 5
:date: "%A, %B %d, %Y"
:excerpts:
:expand: Read more ...
```

:::
::::
