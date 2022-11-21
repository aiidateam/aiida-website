# Events

Besides the public events, the AiiDA team holds biweekly developer meetings  (see [public meeting notes](https://hackmd.io/@aiida)). [Contact us](mailto:developers@aiida.net) if you would like to join the developer meeting via zoom, e.g. to present your AiiDA-related developments.

```{timeline}
:events: /events.yaml
:style: none

**{{dtrange}}**

*{{e.name | trim}}*\
*{{e.location | trim}}*

{% if 'description' in e %}
{{e.description}}
{% endif %}

{% if 'announce' in e %}
Announcement: []({{e.announce | trim}})
{%- endif %}
{% if 'report' in e %}
Report: []({{e.report | trim}})
{%- endif %}
{% if 'url' in e %}
Link: <{{e.url | trim}}>
{%- endif %}
{% if 'participants' in e %}
Participants: {{e.participants}}
{%- endif %}

```
