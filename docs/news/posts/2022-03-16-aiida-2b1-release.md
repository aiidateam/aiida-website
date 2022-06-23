---
blogpost: true
category: Releases
tags: aiida-core
date: 2022-03-16
---

# AiiDA v2.0.0b1 released

We are very happy to announce that today we released the beta version for the second major release of AiiDA! This is the culmination of over two years of work that focused on re-designing the codebase to make it more performant, user-friendly, and maintainable, with minimal changes to the API.

The most significant changes introduced are:

- **New file repository.** The new design is a lot more performant: it includes automatic deduplication of content and the time to create a backup has been reduced by at least an order of magnitude for large repositories.

- **Simplification of the storage backend.** Django has been dropped and is automatically migrated to SqlAlchemy. Together with the new file repository, they are now conceptually unified into the default storage backend provided by `aiida-core`, called `psql_dos`. These changes enabled the introduction of a new experimental feature to switch profiles within an active interpreter (check the changelog [^1] for more details and examples on how to use this).

- **Generalisation of the export archives.** It is no longer necessary to import the archive to easily explore its content, since it is now possible to simply load them as read-only storage backends. This allows, for example, to run queries on the archives as if it was any other profile (see the documentation [^2] for an example use case).

- All **entry points** are now automatically updated (without the need of running `reentry scan`), and those provided by `aiida-core` now start with a ` core.` prefix. This makes their origin more explicit and respects the naming guidelines of entry points in the AiiDA ecosystem. The old names are still supported so as to not suddenly break existing code based on them, but they have now been deprecated.

For a more complete list of changes and added features, see the change log [^3].

As indicated by its denomination, this first release of v2.0 is a beta version, so **we are not yet recommending that people update their production setups**. Instead, we are inviting plugin developers to start using this as their new baseline, and updating their plugins to be compliant with the few adaptations required by 2.0. Experienced users can also try it out in their testing environments.

The default version (i.e. what you get when running `pip install aiida-core`) will continue to be the latest v1.6 **until the non-beta version is released** (which we expect to happen **at the end of April 2022**); for instructions on how to install the beta version, see right below.

**Update procedure**

- **Before updating your installation** make sure you create a full backup with your current version of AiiDA that is installed. **See the docs for the details on how to do this** [^4] (note that this link shows the instructions for v1.6.7; it should be the same for all 1.x versions, but you may want to visit the specific docs to your current version of aiida-core).

- **Then update your installation** to the beta version by running: `pip install aiida-core==2.0.0b1`.

- **Finally migrate your profile** by running `verdi -p <PROFILE_NAME>  storage migrate`. Since this release includes a significant change in the storage backend, **this migration may require some time** (up to hours for big profiles) to perform the migrations.

As always, if you find any problems during your installation or when using this beta version, don’t hesitate to report it to us by opening an issue in our github repository [^5].

Happy computing!

The AiiDA team

[^1]: [https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/reference/\_changelog.html#improvements-to-the-aiida-storage-architecture](https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/reference/_changelog.html#improvements-to-the-aiida-storage-architecture)

[^2]: [https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/howto/archive_profile.html](https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/howto/archive_profile.html)

[^3]: [https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/reference/\_changelog.html](https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0b1/reference/_changelog.html)

[^4]: [https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.7/howto/installation.html#backing-up-your-installation](https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.7/howto/installation.html#backing-up-your-installation)

[^5]: [https://github.com/aiidateam/aiida-core/issues](https://github.com/aiidateam/aiida-core/issues)
