---
blogpost: true
category: Releases
tags: aiida-core
date: 2020-07-21
---

# AiiDA v1.3.0 released

A new AiiDA release v1.3.0 is available! You can find more information at our [download page](http://www.aiida.net/download/). It can be installed through `pip` as:

```sh
pip install aiida-core==1.3.0
reentry scan
```

This is the third minor version of the v1 series and comes with some important performance improvements and features, but also various bug fixes. In addition, [the documentation](https://aiida-core.readthedocs.io/en/latest/) has received a major overhaul, both in structure as well as appearance.

Engine performance
------------------

One of the big improvements of AiiDA v1.0 was the switch to an event-based engine that makes it a lot more responsive and performant. Running processes broadcast messages, such as when their state changes, that others, such as the daemon workers, can respond to. In this release, this mechanism is used to make the engine even more responsive. A work chain that runs subprocesses, will now start listening to their state changes, such that once the last running subprocess messages that it has finished, the work chain can resume to the next step immediately. This event-based messaging makes the work chains very responsive, however, it is possible that now and again a message slips through the cracks, in which case the work chain would be waiting indefinitely. As a backup, we keep a polling mechanism that will check the status of each subprocess every interval to see whether it has already finished. In previous releases, this was the only mechanism and it would poll every second. This would keep the computer running AiiDA unnecessarily busy. With the new broadcasting mechanism, we were able to increase the polling interval from 1 to 60 seconds. You can even customize this if you would like:

```sh
    verdi config runner.poll.interval 120
```

Note that this polling mechanism is really a backup system and the engine will not rely on it in the vast majority of cases. Still, if you don’t mind waiting a bit longer in this very unlikely case, you can always increase the interval a bit more.

For more details on this release, see the [change log](https://github.com/aiidateam/aiida-core/blob/v1.3.0/CHANGELOG.md).
