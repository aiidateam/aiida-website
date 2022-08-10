---
blogpost: true
category: Releases
tags: aiida-core
date: 2020-03-03
---

# AiiDA v1.1.1 released

A new AiiDA release v1.1.1 is available! You can find more information at our [download page](/sections/download.md). It can be installed through `pip` as:

```sh
pip install aiida-core==1.1.1
```

This is the first patch release of the `v1.1` series and as such contains mostly bug fixes and some minor changes and improvements. The most important changes relate to the **caching mechanism** and the `BaseRestartWorkChain`.

## Caching mechanism

Due to a bug, certain calculations were not cached where they should, which has now been fixed. In addition, the format of the caching configuration file was broken, which has now been fixed (see [the documentation](https://aiida-core.readthedocs.io/en/v1.1.1/working_with_aiida/caching.html#configuration)).

**BaseRestartWorkChain
**The `BaseRestartWorkChain`class and associated utilities were added for beta trial in `aiida-core==1.1.0`. We have had useful discussions with developers and users during the AiiDA hackathon at CINECA from 17–21 February (see [the report](../pics/legacy/Bologna-hackathon-report.pdf)).

As a result of these discussions, we have decided to change the use of the `register_process_handler`. It has been renamed to `process_handler` and can now _only_ be used to decorate instance methods of the work chain class within its scope and no longer outside of it. In addition, the decorator has a new keyword argument `enabled`, which determines whether the handler is by default considered during process handling. This default value can be overridden on a per work chain basis through the new `handler_overrides` input. Since the interface changed since its introduction in `aiida-core==1.1.0`, please **only use the `BaseRestartWorkChain` from `aiida-core>=v1.1.1`**.

More details and download options can be found through the following links:

- [Change log](https://github.com/aiidateam/aiida-core/blob/v1.1.1/CHANGELOG.md)
- [Clone url](https://github.com/aiidateam/aiida-core/tree/v1.1.1)
- [Download zip](https://github.com/aiidateam/aiida-core/archive/v1.1.1.zip)
