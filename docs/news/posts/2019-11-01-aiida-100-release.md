---
blogpost: true
category: Releases
tags: aiida-core
date: 2019-11-01
---

# AiiDA v1.0.0 released

After thorough beta-testing, we have just released AiiDA version `1.0.0`. This milestone is the result of almost two years of development on top of version `0.12.x`, and comes with a bunch of major improvements:

*   Faster workflow engine: the new message-based engine powered by RabbitMQ supports tens of thousands of processes per hour and greatly speeds up workflow testing. You can now run an individual daemon for each  AiiDA profile at the same time.
*   Robust calculations: AiiDA now deals with network connection issues (automatic retries with exponential-back-off  mechanism, connection pooling, …) out of the box. Workflows and calculations are all Processes and can be "paused" and "played" at will.
*   Faster database queries: the switch to JSONB for node attributes and extras greatly improves query speed and reduces storage size by orders of magnitude.
*   Easier workflow development: Input and output namespaces, reusing specs of sub-processes and less boilerplate code simplify writing WorkChains and CalcJobs, while also enabling powerful auto-documentation features.
*   Better verdi commands: the move to the “click” framework brings homogeneous command line options across all commands (loading nodes, …). You can easily add new commands through plugins.
*   Mature provenance model: Clear separation between data provenance (Calculations, Data) and logical provenance (Workflows). Old databases can be migrated to the new model automatically.
*   Python 3 compatibility: AiiDA 1.0 is compatible with both python 2.7 and python 3.6 (and later). Python 2 support will be dropped starting January 2020.

For more details on the changes, see the [change log](https://github.com/aiidateam/aiida-core/blob/v1.0.0/CHANGELOG.md).

As usual, you can install AiiDA 1.0 using `pip install aiida-core==1.0.0` – but please follow the installation instructions from the [documentation](https://aiida-core.readthedocs.io/en/latest/) if you are upgrading from AiiDA 0.x as the prerequisites have changed

Please note that AiiDA 1.0 includes a number of [backwards-incompatible changes in the python API](https://aiida-core.readthedocs.io/en/latest/install/updating_installation.html#backwards-incompatible-changes) compared to v0.12 (the API of 1.0 beta has been stable since the first beta release in February 2019). Existing databases are migrated automatically and will be fully compatible with `v1.0.0`.

The changes in the API, however, require existing code and [plugins to be updated](https://github.com/aiidateam/aiida-core/wiki/AiiDA-1.0-plugin-migration-guide) in order to work with 1.0. Many plugins already have been successfully migrated, as you can see on the [AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/), and most are expected to provide stable releases soon.

Over the next months we will focus on further improving the stability of AiiDA 1.0 and weeding out remaining bugs. We already have a couple of events in the pipeline for 2020, with topics ranging introductions for first-time AiiDA users over advanced workflow development to developing plugins and aiida-core.

We’ll keep you posted on the AiiDA mailing list!

Happy computing,

The AiiDA team
