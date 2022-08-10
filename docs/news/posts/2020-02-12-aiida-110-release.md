---
blogpost: true
category: Releases
tags: aiida-core
date: 2020-02-12
---

# AiiDA v1.1.0 released

A new AiiDA release `v1.1.0` is available! You can find more information at our [download page](/sections/download.md).

This is the first minor release of the v1 series, in which we finally **drop the support for older python 2** versions (critical bug fixes for python 2 will be supported until July 1 2020 on the `v1.0.*` release series) and **add support for python 3.8**, thus becoming compatible with all current python versions that are not end-of-life (i.e.: 3.5, 3.6, 3.7, 3.8). You can find the reasoning for doing this without a major version change in the corresponding [AEP 001](https://github.com/aiidateam/AEP/tree/master/001_drop_python2).

The update also includes some bug fixes and performance improvements, as well as some interesting new features such us as new tools for traversing the AiiDA provenance graphs ([AiiDA Graph Explorer](https://github.com/aiidateam/aiida-core/pull/3686)), which is now used for consistently deleting and exporting nodes with a considerable increase in performance, and tools for automated error handling for workchains ([`BaseRestartWorkChain`](https://github.com/aiidateam/aiida-core/pull/3748)). Finally, great efforts have been made towards relaxing the dependencies of the code in order to make it easier to install AiiDA side-by-side with other packages: plugin developers are encouraged to adopt a similar philosophy, going through their own dependencies and relaxing them where applicable.

More details and download options can be found through the following links:

- [Change log](https://github.com/aiidateam/aiida-core/blob/v1.1.0/CHANGELOG.md)
- [Clone url](https://github.com/aiidateam/aiida-core/tree/v1.1.0)
- [Download zip](https://github.com/aiidateam/aiida-core/archive/v1.1.0.zip)
