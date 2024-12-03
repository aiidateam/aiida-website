---
blogpost: true
category: Reports
tags: coding-week
author: The AiiDA team
date: 2024-12-03
---

# Achievements from the AiiDA coding week 2024

Dear AiiDA users, as promised, in this week's blog post we give you a rundown of the key achievements of the AiiDA coding week 2024 held
in Leysin, Switzerland during 18-22 of November.


## [aiida-core](https://github.com/aiidateam/aiida-core)

### Asynchronous transport

One [significant PR](https://github.com/aiidateam/aiida-core/pull/6626) that has come out of the coding week has been to
add a _truly_ asynchronous transport plugin. While the AiiDA engine is, in general, written asynchronously, file upload
and retrieve tasks were actually still executed in a blocking manner. With the new `AsyncTransport` plugin, file
uploads/downloads won't be blocking the interpreter anymore.

### `pydantic` to specify ORM entities

Another large [open PR](https://github.com/aiidateam/aiida-core/pull/6255) that we dedicated some time towards aims to
use `pydantic` to specify schemas for all of AiiDA's object-relational mapper (ORM) entities (the AEP can be found
[here](https://github.com/aiidateam/AEP/blob/983a645c9285ba65c7cf07fe6064c23e7e994c06/010_orm_schema/readme.md)).
However, further testing of compatibility and its effects on performance will have to be done.

### Replacing RabbitMQ

In addition, there is work in progress to implement a custom message broker that can be shipped with `aiida-core` to
replace RabbitMQ, such that AiiDA can be used entirely without external services. While the repository where the
development is happening is currently
still private, notes for its design can be found in the AiiDA enhancement proposals (AEPs)
[#30](https://github.com/aiidateam/AEP/pull/30) and [#42](https://github.com/aiidateam/AEP/pull/42). It is further based
on earlier work, which can be found in [this repository](https://github.com/chrisjsewell/aiida-process-coordinator).

### Easier life for developers

Other parts of the work on `aiida-core` have actually been focused on making the life of developers easier. For example, we will
spend less time waiting for the tests to finish by running the test suite in parallel
([PR 6620](https://github.com/aiidateam/aiida-core/pull/6620)) and we reduced the verbosity of the pytest output (for
successful tests) when running via CI ([PR 6633](https://github.com/aiidateam/aiida-core/pull/6633)). In addition, as
it is now possible to set up an AiiDA profile using SQLite instead of PostgreSQL, we also have changed the default for
running the test suite locally to use the former instead of the latter (see
[this PR](https://github.com/aiidateam/aiida-core/pull/6625)), thus not requiring PSQL as a system service. Lastly, one
can now explicitly specify the database backend to be used via the new flag `--db-backend=[sqlite,psql]` (rather than
through pytest markers in the source code, as was done previously).


## [AiiDAlab QE app](https://github.com/aiidalab/aiidalab-qe)

A significant [refactoring PR](https://github.com/aiidalab/aiidalab-qe/pull/802) (~10k lines of code changed!) on the
AiiDAlab QE app has been merged 🎉 This PR implements lazy-loading across the code base, using the model-view-controller
(MVC) design pattern outlined in our [last blog post](https://aiida.net/news/posts/2024-11-15-aiidalab-mvc.html). It
makes the app significantly more responsive and snappy. This ties in well with the upcoming release of the [AiiDAlab
demo server](https://github.com/aiidalab/aiidalab-demo-server), that will allow you to run AiiDAlab fully in the
browser, without any local installation or setup.
In addition, a [PR](https://github.com/aiidalab/aiidalab-qe/pull/939) was merged that refactors the computational
resource setup in the QE app, also following the MVC design pattern.
Furthermore, significant efforts have been made to thoroughly test and provide feedback of the user interaction and user
experience (UI/UX) of the app, as well as test it under realistic conditions within the upcoming demo server, to iron
out the last details. The issues that have been identified are now being addressed one by one before the next release.


## [aiida-quantumespresso](https://github.com/aiidateam/aiida-quantumespresso)

Improvements to nudged-elastic band (NEB) calculations have been merged with
[this PR](https://github.com/aiidateam/aiida-quantumespresso/pull/1049), retrieving intermediate image structures of the
trajectory. Further, the parsing of output files created during the run of `pp.x` calculation has been made optional
(see [this PR](https://github.com/aiidateam/aiida-quantumespresso/pull/1029)). Additionally, there has been a lot of
discussion about future improvements to the parsing, including starting to move the core parsing routines outside of the
AiiDA plugin, into the more generic [qe-tools](https://github.com/aiidateam/qe-tools) package. Finally, we started to work
on CLI features to simplify the setup and testing of QE executables – PR will follow soon.


## [aiida-workgraph](https://github.com/aiidateam/aiida-workgraph)

As we approach the first stable release of WorkGraph, several developers and users actively participated to test and
adapt their existing WorkChains to WorkGraph. Their valuable feedback on the API has been instrumental in refining the
tool.
During the week, the group engaged in productive discussions about the WorkGraph syntax, which led to a series of
improvements to the API. We also explored the implementation of
[AiiDA common workflows](https://github.com/aiidateam/aiida-common-workflows)
using WorkGraph, brainstorming various approaches and working on examples to demonstrate its potential.

To maintain a clean and focused repository for WorkGraph development, we decided to move the **PythonJob plugin** to a
separate repository: [aiida-pythonjob](https://github.com/aiidateam/aiida-pythonjob).
In addition to these discussions, key bugs were identified and resolved:
- A bug when running `aiida-shell` via WorkGraph has been fixed in
[this PR](https://github.com/aiidateam/aiida-workgraph/pull/351)
- The requirement of specifying inputs/outputs/parser_outputs in the decorator signature when creating a `Task` has been
  lifted, allowing for a less verbose syntax ([PR](https://github.com/aiidateam/aiida-workgraph/pull/343))
- A bug with the entry point was addressed ([PR #352](https://github.com/aiidateam/aiida-workgraph/pull/352))
- And, lastly, a bug with the namespace input reported by a Siesta user was fixed
([PR #350](https://github.com/aiidateam/aiida-workgraph/pull/350))

You can keep updated with the developments towards the v0.5 release through
[this GitHub project](https://github.com/orgs/aiidateam/projects/10).


## [aiida-restapi](https://github.com/aiidateam/aiida-restapi)

The `aiida-restapi` was [migrated to Pydantic v2](https://github.com/aiidateam/aiida-restapi/pull/75) to be compatible
with recent `aiida-core` versions (>=2.5). Additionally, various endpoints of the old REST-API were implemented.
In line with the migration to `pydantic` for all AiiDA ORM classes (see
[this open PR](https://github.com/aiidateam/aiida-core/pull/6255) as already linked above), work has been carried out on
the AiiDA REST API, to prepare the repository for use of the corresponding `pydantic` ORM models.


## [aiida-atomistic](https://github.com/aiidateam/aiida-atomistic)

AiiDA is a general workflow manager, even if historically it started from the field of atomistic simulations. It is
currently also applied to drive experimental hardware, and perform simulations in other fields such as weather and
climate, as well as atmospheric simulations (work in progress). Therefore, we are planning to eventually move all classes
specific to atomistic simulations out of `aiida-core` and into the new [aiida-atomistic](https://github.com/aiidateam/aiida-atomistic)
package. These changes will only be concluded and published with the next major release, as some of them will be
backward-incompatible.

However, this gives us the opportunity to further refine and improve the relevant classes.
In particular, lots of discussions on the design of the new `StructureData` class have been held, and the current design
choices can be found [here](https://github.com/aiidateam/aiida-atomistic). These include adding properties stored with
each structure, including for instance magnetization, Hubbard U and V values, etc. During the coding week, some members
of the AiiDA team have been working on this topic, with the issues found
[here](https://github.com/aiidateam/aiida-atomistic/issues?q=label%3Acoding-week) on GitHub. The main result achieved is
the development of a clear API to query `StructureData` from the AiiDA database with respect to the defined properties
(charge state, magnetization and so on).


## Misc

Work has also been dedicated to the [aiida-muon](https://github.com/positivemuon/aiida-muon) plugin to improve the
testing suite and to add support for NEB calculations as post processing for selected candidate muon resting sites. The
[aiida-test-cache](https://github.com/aiidateam/aiida-test-cache) plugin to simplify the testing of AiiDA workflows has
[been updated](https://github.com/aiidateam/aiida-test-cache/issues/74) to be compatible with recent versions of
`aiida-core`.
