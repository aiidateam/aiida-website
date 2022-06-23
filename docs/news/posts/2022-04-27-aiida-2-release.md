---
blogpost: true
category: Releases
tags: aiida-core
date: 2022-04-27
---

# AiiDA v2.0.0 released

We are very happy to announce that today we released the final version of **AiiDA v2.0**! This is the culmination of over two years of work that focused on re-designing the codebase to make it more performant, user-friendly, and maintainable, with minimal changes to the API.

The most significant changes introduced were already present in the beta. As a reminder, we also list them here:

- **New file repository.** The new design is a lot more performant: it includes automatic deduplication of content and the time to create a backup has been reduced by at least an order of magnitude for large repositories.
- **Simplification of the storage backend.** Django has been dropped and is automatically migrated to SqlAlchemy. Together with the new file repository, they are now conceptually unified into the default storage backend provided by `aiida-core`, called `psql_dos`. These changes enabled the introduction of a new experimental feature to switch profiles within an active interpreter (check the changelog[^1] for more details and examples on how to use this).
- **Generalisation of the export archives.** It is no longer necessary to import the archive to easily explore its content, since it is now possible to simply load them as read-only storage backends. This allows, for example, to run queries on the archives as if it was any other profile (see the documentation[^2] for an example use case).
- All entry points are now automatically updated (without the need of running `reentry scan`), and those provided by `aiida-core` now start with a `core.` prefix. This makes their origin more explicit and respects the naming guidelines of entry points in the AiiDA ecosystem. The old names are still supported so as to not suddenly break existing code based on them, but they have now been deprecated.

For a more complete list of changes and added features, see the change log [^1].

As with all major AiiDA updates, we recommend that users create a full backup of their profiles before updating their installation. See the docs for more details on how to do this [2] (note that this link shows the instructions for v1.6.7; it should be the same for all 1.x versions, but you may want to visit the specific docs to your current version of aiida-core).

Note that since this release includes a significant change in the storage backend, it may require some time (up to hours for big profiles) to perform the migrations. When you are ready to proceed, you just need to run `verdi -p <PROFILE_NAME> storage migrate` and wait.

If you find any problems during your installation or afterwards while using this new version, don’t hesitate to report it by opening an issue in the Github repository [^3].

Happy computing!

The AiiDA team

[^1]: https://aiida.readthedocs.io/projects/aiida-core/en/v2.0.0/reference/_changelog.html
[^2]: https://aiida.readthedocs.io/projects/aiida-core/en/v1.6.7/howto/installation.html#backing-up-your-installation
[^3]: https://github.com/aiidateam/aiida-core/issues
