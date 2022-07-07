---
blogpost: true
category: Releases
tags: aiida-core
date: 2021-11-13
---

# AiiDA v1.5.0 released

This is the fifth minor version of the v1 series and comes with a couple of new features, as well as some relevant bug fixes. Support for Python 3.5 is dropped and support for Python 3.9 is added.

## Process functions are now submittable

Since the changes introduced in v1.0, a process function creates a `Process` instance in the background, just as any other process. This means that, in principle, it could also be serialized and deserialized by a daemon worker from that point onwards. Here we remove the final limitations that prevented process functions from being fully submittable.

It is important to note that the usual rules for making processes submittable apply in this case as well: to be importable by the daemon, it will need to either be registered through an entry point or have its source module available through the PYTHONPATH environment variable. For more information on these requirements, you can check the specific section on [launching processes](https://aiida-core.readthedocs.io/en/latest/topics/processes/usage.html#process-launch) in the AiiDA documentation.

## New REST API features

This minor version introduces two new features to the REST API interface of AiiDA. The first one is that the base URL (`http://127.0.0.1:5000/api/v4` in a local deployment, for example) will now return a list of the available endpoints. The second one is the addition of a new endpoint `full_types_count`: this returns the same branched structure that the already existing `full_types`, but with the addition of a `counter` key which contains the count of all available node instances of the type indicated.

## Archive Refactor

This is part of a series of modifications that aim at making several improvements in the performance and versatility of the process of exporting and importing databases. These changes here should minimally affect the existing interface and might already have some performance boosts, but are an important stepping stone for more significant improvements in the upcoming versions.

For more details on this release, see the [change log](https://github.com/aiidateam/aiida-core/blob/v1.5.0/CHANGELOG.md).

Happy computing!

The AiiDA team
