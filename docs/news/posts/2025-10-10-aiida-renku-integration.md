---
blogpost: true
category: Blog
tags: deployment, integration
author: Julian Geiger, Laura Kinkead, Giovanni Pizzi
date: 2025-10-10
---

# One-click exploration of AiiDA archives via RenkuLab

## The Problem: Data access and local setup

The [Materials Cloud Archive (MCA)](https://archive.materialscloud.org/) is the platform provided by the community to host computational materials science data generated using AiiDA.
While making the data, in principle, available to the research community at large, accessing it historically required users to install AiiDA locally, including complex system dependencies like the PostgreSQL and RabbitMQ system services[^x].
In addition, users needed prior knowledge of AiiDA's API and CLI to explore the computational data effectively.

This barrier meant that the data hosted on MCA was effectively locked to users already familiar with AiiDA or willing to invest the necessary time to learn it.
And, still, even experienced users had to manually download archives and configure their local environments before exploring the data---time that could have been spent on research itself.

## The Solution: Integration with RenkuLab

Hence, in 2019, the AiiDA development team decided to partner with [Renku](https://renkulab.io/), a platform for reproducible and collaborative data science, to address these challenges.
Both platforms share a Swiss origin, as well as a commitment to provenance tracking, making them natural partners.
While AiiDA automatically tracks data provenance during computational simulation workflows through directed acyclic graphs (DAGs) for computational materials science workflows, Renku captures provenance and lineage of research objects in a knowledge graph.

The integration enables researchers to click the Renku logo next to any AiiDA archive on MCA and be automatically launched into a fully configured environment with their selected data ready for exploration—eliminating the need for local installation and configuration entirely.

<!-- TODO: add screenshot here or reference series at the end

## Technical Implementation

### Initial Implementation (Renku v1)

The first version was built as a Renku template based on the Renku2 Docker image, with the AiiDA installation baked into the image creation process.
The [original contributed AiiDA template](https://github.com/SwissDataScienceCenter/contributed-project-templates/tree/main/aiida) used Jinja2 placeholders to conditionally populate metadata in a Jupyter notebook and configuration files based on the existence of an archive URL pointing to the MCA record.

This design ensured the template could be used both when launched from MCA and when accessed directly from the Renku website.
A post-init script set up the appropriate AiiDA profile type, using either the `sqlite_zip` storage backend (which directly mounts the provided archive as read-only) or the `sqlite_dos` backend (which initializes a new SQLite database and disk-objectstore repository for future archive imports).

On the MCA side, the integration was achieved by building a Renku URL with the necessary parameters to automatically configure the template with the selected archive data.
This link is accessible via the Renku logo displayed next to each AiiDA archive on MCA record pages.
In the initial implementation, the Renku project creation process still required user interaction with Renku's GUI, though all data was prefilled based on the URL parameters.

### Current Implementation (Renku v2)

With the upgrade to Renku v2, the integration evolved significantly while retaining its core technical foundations.
The [current implementation](https://github.com/aiidateam/renku2-aiida-integration) introduces several key improvements:

**Deferred Archive Download**: The archive download step is deferred to manual execution of notebook cells by the user, rather than occurring at session startup.
This drastically reduces startup time.

**Enhanced Startup Notebook**: The startup notebook now contains additional code snippets showcasing AiiDA's API for archive exploration, while internal backend code (e.g., archive download and AiiDA profile setup) is hidden in auto-folded cells.

**Metadata-Driven Customization**: The archive URL from the MCA record is available as an environment variable and is used to fetch relevant metadata via the InvenioRDM API.
This enables a more customized startup notebook, with the set of displayed cells adapted based on the archive URL presence using cell tags.

**True One-Click Access**: The GUI-based project creation step required in Renku v1 is bypassed through the use of a [pre-created project](https://renkulab.io/p/aiida/materials-cloud-archive), enabling genuine one-click access from MCA.

**Updated AiiDA Features**: The Docker image includes an updated aiida-core version, making recently added features available.
One notable feature is the capability to dump all relevant data of an AiiDA process (or entire profile) to disk in a human-readable format.
The output folder can then be explored using the Jupyter file browser, command line utilities, or downloaded to a local machine.

You can explore the integration yourself on [RenkuLab](https://renkulab.io/p/aiida/materials-cloud-archive).

## Impact and Timeline

The first version of the Renku integration was established five years ago and has continuously evolved.
Without the infrastructure provided by Renku, the first working online deployment would likely have been achieved much later.
While the AiiDA development team has also recently prepared an [AiiDAlab demo server](https://demo.aiidalab.io/)—geared more towards the AiiDAlab graphical user interface and teaching—the fact that this is still being developed while the Renku integration has been operational for years demonstrates the value of leveraging existing platforms.

## Future Directions

The AiiDA development team is exploring several enhancements using Renku v2's new capabilities:

### Data Connectors

Renku v2 provides "data connectors" that can mount data from supported providers directly in a project's filesystem.
Since MCA uses the InvenioRDM platform, which Renku v2 supports, creating an MCA data connector could allow mounting AiiDA archives directly without downloading them.
This would address two significant issues:

1. **Time savings**: Eliminating download times for large archives (the team recently supported a user with a 15TB AiiDA project)
2. **Storage limitations**: Renku projects come with limited disk space (10GB), easily exceeded by large archives

However, technical challenges remain.
Many MCA archives were created with older AiiDA versions and require data migration to work with current versions.
Since mounted filesystems via data connectors are read-only, AiiDA's current in-place migration approach doesn't work.
Potential solutions include periodic automatic migrations of MCA archives or migrating to the project's actual filesystem (though this sacrifices the data connector's main advantage of instant access without downloads).

### Expanding the AiiDAlab App Ecosystem

Renku v2's support for arbitrary Docker images opens possibilities for integrating other AiiDA applications.
Work has already been done to make the [AiiDAlab Quantum ESPRESSO (aiidalab-qe) app compatible with Renku](https://github.com/aiidalab/aiidalab-qe/pull/1105), potentially providing the same GUI and user experience as the standalone app.
Other candidates include the [`aiida-archive-inspect` app](https://github.com/superstar54/aiida-archive-inspect), which could display information about all available AiiDA archives for an MCA page and enable interactive selection.

## Lessons Learned

From the AiiDA development team's perspective, the collaboration with Renku exemplifies the KISS principle: "Keep it simple, stupid."
Rather than reinventing infrastructure that already exists, investing time to find and familiarize yourself with existing solutions often proves more efficient than building from scratch.

Renku has been very stable throughout the various integration stages, and the Renku team has consistently been responsive and helpful with technical concerns.
While the AiiDA-Renku integration uses only part of Renku's technical infrastructure, the platform's ability to connect external tools and data sources with ready-to-use computational environments makes it an ideal foundation for eliminating setup barriers and enabling instant access to complex research workflows.

## Conclusion

The integration between AiiDA and RenkuLab demonstrates how research infrastructure can evolve from serving primarily expert users to welcoming the broader scientific community.
By removing barriers between data discovery and analysis, the integration enables more researchers to engage with computational datasets, ultimately accelerating scientific discovery in materials science and beyond.

For researchers interested in exploring AiiDA archives on the Materials Cloud Archive, simply look for the Renku logo next to any archive and click to begin your exploration.

[^x]:
    Before they were made optional, and before the `verdi presto` endpoint was implemented

[^x]:
    Before the `sqlite_zip` storage backend was added -->
