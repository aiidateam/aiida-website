---
blogpost: true
category: Releases
tags: aiida-core
date: 2021-03-28
---

# AiiDA v1.6.0 released

We are happy to inform you that we have just released v1.6.0!
As per SemVer versioning, this release is fully backwards-compatible.

The full changelog can be found at: [CHANGELOG](https://github.com/aiidateam/aiida-core/blob/v1.6.0/CHANGELOG.md), but here are some highlights:

## Migration to asyncio ♻️

This release marks the “under-the-hood” migration from the `tornado` package to the Python built-in module `asyncio`, for handling asynchronous processing within the AiiDA engine. Thanks to Jusong Yu, a member of last year’s Google Summer of Code project!
The migration removes a number of blocking dependency version clashes with other tools, in particular with the newest Jupyter shell and notebook environments.
A substantial effort has been made to test and debug the new implementation, and ensure it performs at least equivalent to the previous code (or improves it!), but please let us know if you uncover any additional issues.

## New calculation features ✨

The `additional_retrieve_list` metadata option has been added to `CalcJob`.
This new option allows one to specify additional files to be retrieved on a per-instance basis, in addition to the files that are already defined by the plugin to be retrieved.

A new namespace `stash` has been added to the `metadata.options` input namespace of the `CalcJob` process.
This option namespace allows a user to specify certain files that are created by the calculation job to be stashed somewhere on the remote.
This can be useful if those files need to be stored for a longer time than the scratch space (where the job was run) is available for, but need to be kept on the remote machine and not retrieved.
Examples are files that are necessary to restart a calculation but are too big to be retrieved and stored permanently in the local file repository.

See [Stashing files on the remote](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/topics/calculations/usage.html#stashing-files-on-the-remote) for more details.

The new `TransferCalcjob` plugin allows the user to copy files between a remote machine and the local machine running AiiDA.
More specifically, it can do any of the following:

* Take any number of files from any number of `RemoteData` folders in a remote machine and copy them in the local repository of a single newly created `FolderData` node.
* Take any number of files from any number of `FolderData` nodes in the local machine and copy them in a single newly created `RemoteData` folder in a given remote machine.

See the [Transferring data how-to](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/howto/data.html#transferring-data) for more details.

## Profile configuration improvements 👌

The way the global/profile configuration is accessed has undergone a number of improvements:

* When loaded, the `config.json` (found in the `.aiida` folder) is now validated against a JSON Schema that can be found in [aiida/manage/configuration/schema](https://github.com/aiidateam/aiida-core/tree/v1.6.0/aiida/manage/configuration/schema).
* The schema includes a number of new global/profile options, including: `transport.task_retry_initial_interval`, `transport.task_maximum_attempts`, `rmq.task_timeout` and `logging.aiopika_loglevel`.
* The `cache_config.yml` has now also been **deprecated** and merged into the `config.json`, as part of the profile options. This merge will be handled automatically, upon first load of the `config.json` using the new AiiDA version.

In-line with these changes, the `verdi config` command has been refactored into separate commands, including `verdi config list`, `verdi config set, verdi config unset` and `verdi config caching`.
See the [Configuring profile options](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/howto/installation.html#configuring-profile-options) and [Configuring caching](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/howto/run_codes.html#how-to-save-compute-time-with-caching) how-tos for more details.

## Command-line additions and improvements 👌

In addition to `verdi config`, numerous other new commands and options have been added to `verdi`, including:

* Added `verdi group delete --delete-nodes`, to also delete the nodes in a group during its removal.
* Added `verdi database summary`,  which prints a summary of the count of each entity and (optionally) the list of unique identifiers for some entities.
* **Deprecated** `verdi export` and `verdi import` commands (replaced by new `verdi archive`)

## New REST API Query endpoint ✨

The `/querybuilder` endpoint is the first POST method available for AiiDA’s RESTful API.
The POST endpoint returns what the QueryBuilder would return, when providing it with a proper `queryhelp` dictionary ([see the documentation here](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/topics/database.html#the-queryhelp)).

See [AiiDA REST API documentation](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.0/reference/rest_api.html) for more details.

Happy computing!

The AiiDA team
