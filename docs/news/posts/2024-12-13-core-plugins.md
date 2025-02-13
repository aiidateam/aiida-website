---
blogpost: true
category: Blog
tags: plugins, usability, high-throughput
author: Julian Geiger, Marnik Bercx
date: 2024-12-13
---

(post-aiida-core-plugins)=

# Non research-domain specific plugins to extend core functionality

Dear users, we're happy to announce that we have recently crossed the 100-plugin milestone of registered plugin packages on the [AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/).
Among those are classics like [`aiida-quantumespresso`](https://github.com/aiidateam/aiida-quantumespresso/) and [`aiida-vasp`](https://github.com/aiidateam/aiida-vasp/), which support the electronic structure codes we all know and love.
However, did you know that there are various non research-domain specific plugins that AiiDA developers have created over the years, which can extend AiiDA's core functionality?
In today's post, we would like to give you a short introduction to some of these plugins, and show you when you can incorporate them into your work, to make sure you'll get the most out of your AiiDA journey![^1]

## Simplifying code execution and workflow creation

### [`aiida-workgraph`](https://github.com/aiidateam/aiida-workgraph/)

We've been making quite a bit of fuzz about this one in recent weeks already, as we're targeting a first, stable release for early next year (fingers crossed 🤞).
The `aiida-workgraph` provides an alternative way to write workflows, in addition to (but not replacing) the classical `WorkChain`.
It comes with all the typical AiiDA features, like provenance tracking, checkpointing, caching, and remote execution, but provides a simpler syntax, and allows you to write workflows more interactively.
This can be achieved by adding graph nodes[^2] (or `Tasks`, as we call them) and links, in equivalence to how one would typically build-up a graph.
In this way, `aiida-workgraph` makes it simpler to quickly connect existing AiiDA components (`CalcJobs`, `WorkChains`, or other `WorkGraphs`), and even allows visualizing the flow of data via the different processes before the workflow is executed (through an interactive web GUI).
As we're currently stabilizing the API, any feedback is valuable and helps us to polish the tool as best as we can before the release!
You can read more about it on its [documentation page](https://aiida-workgraph.readthedocs.io/en/latest/), and find example `WorkGraphs` in [this repository](https://github.com/superstar54/workgraph-collections).

### [`aiida-shell`](https://github.com/sphuber/aiida-shell/)

Probably we don't have to talk too much about this one, as we covered it in depth in one of our recent [blog posts](https://aiida.net/news/posts/2024-11-01-aiida-shell.html) (with additional information available [on its documentation page](https://aiida-shell.readthedocs.io/en/latest/)).
In a nutshell, `aiida-shell` allows you to run any executable (e.g., a shell script, Python script, compiled binary, etc.) without the need for writing an entire plugin interface for it.
Just plug it into the `launch_shell_job` function, and you're ready to rumble!
If you eventually _do_ want to have a more sophisticated interface for your code or script, and you can't find one on the [AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/), [this later section](#aiida-plugin-cutter) of the post might also be interesting to you.

## Enhancing high-throughput

### [`aiida-submission-controller`](https://github.com/aiidateam/aiida-submission-controller/)

Have you ever wondered how a "hero run" like the one recently conducted on the new CSCS Alps infrastructure (read more about it [here](https://nccr-marvel.ch/highlights/AiiDA-hero-run-Alps)) can be orchestrated?
In case you want to run a certain workflow, or several connected ones, for a set of structures, it can be handy to have a tool that:

1. Takes care of keeping a certain number of active workflows at any time, without needing to monitor the runs.
2. Makes sure you don't run the same structure twice.

This is exactly the goal of the `aiida-submission-controller`.
Setting up a controller simply requires that you specify how to run the process you want to run based on the parent node, and optionally the extras you use to track which structures have been run.
Be sure to check out the examples in the repository, and if you have any questions simply raise them on the [AiiDA Discourse](https://aiida.discourse.group/latest)!

### [`aiida-hyperqueue`](https://github.com/aiidateam/aiida-hyperqueue/)

If you've ever run simulations on a high-performance computing (HPC) infrastructure, you're likely familiar with scheduling systems such as SLURM, SGE and PBSPro (AiiDA supports all of these, by the way 😉).
However, you might have issues when running many small calculations through AiiDA on these queueing systems.
Maybe your HPC cluster has a low limit on the number of active jobs allowed at any time, or the total queueing time for your workflow becomes prohibitively large.
In this case, you might want to have a look at the `aiida-hyperqueue` plugin, which interfaces AiiDA with the [HyperQueue scheduler](https://github.com/It4innovations/hyperqueue).
This allows you to run many jobs in parallel on a single node, and avoids having to requeue for each calculation in your workflow.
So if you ever need to run a lot of shorter simulations, make sure to give it a shot![^3]

## AiiDA setup

### [`aiida-project`](https://github.com/aiidateam/aiida-project/)

As we outlined in [another one of our recent blog posts](https://aiida.net/news/posts/2024-09-20-simpler-installation.html), since v2.0, we have significantly simplified the creation of an AiiDA profile.
Still, if you find yourself juggling many different profiles on your machine, each with its own configuration, Python environment, and directory of setup files (e.g., for `Computer` and `Code` instances), it can become easy to mess things up.[^4]
To help out with this, `aiida-project` encapsulates and automates the steps to create and switch between different projects using AiiDA, basically functioning as an _AiiDA environment manager_.
It creates the necessary directories and Python environments for you (via `pip` or `conda`) in standardized locations, and enables easy switching between projects.
Installation is simple, e.g., via `pipx`, and `uv` support is [coming soon](https://github.com/aiidateam/aiida-project/pull/28)!

### [`aiida-code-registry`](https://github.com/aiidateam/aiida-code-registry/)

In the previous paragraph, we mentioned storing setup files for `Computer` and `Code` instances in specific directories.
Let's elaborate on this further:
If you have interactively created such entities via `verdi computer setup` and `verdi code create` by filling in the prompts you are being asked on the command line (which is the route we usually mention in the tutorials), it might be worthwhile to export their configurations from the AiiDA database into YAML files.[^5]
From these files, new instances can then be created by passing them to the above two commands via the `--config` flag.
This allows you to re-use the configurations, make and track changes, and follow a Configuration-as-Code (CaC) approach.
To facilitate this process, we maintain the `aiida-code-registry`[^6] as a collection of such configuration files, which can thus serve as a great way to share existing and start setting up new resources!
If you don't find the national HPC you're using in the repository, and your configuration is somewhat transferable, feel free to make a PR &mdash; like this, you might help out others to get started!

## Miscellaneous

(aiida-plugin-cutter)=

### [`aiida-plugin-cutter`](https://github.com/aiidateam/aiida-plugin-cutter/)

Not only when writing papers can it be hard to start from a blank page, but also when beginning with the development of a new AiiDA plugin (or any software project, really).
To help you out with this, the `aiida-plugin-cutter` provides a cookiecutter template for an AiiDA plugin.[^7]
It contains - in the typical expected directory structure - a barebone `Calculation` class (derived from `CalcJob`, and implementing the two main methods `define` and `prepare_for_submission`), a minimal `Parser` class, a command-line-interface (CLI), tests, and some CI/CD, such as `pre-commit` and GitHub Actions setup.
It therefore provides you with everything you need to get started to contribute to the
[AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/) yourself!

### [`aiida-firecrest`](https://github.com/aiidateam/aiida-firecrest/)

This repository implements a `Transport` and `Scheduler` plugin for [FirecREST](https://www.cscs.ch/services/products/firecrest/), a new REST interface for accessing HPC resources developed at the Swiss National Supercomputing Centre (CSCS).
FirecREST addresses many of the security concerns of SSH, among others, providing more fine-grained access control limited by the endpoints given by the REST interface.
As this approach is very different from the classical HPC communication via SSH, this AiiDA plugin ensures continued seamless communication of AiiDA to the CSCS machines &mdash; in all supported ways.

### [`aiida-pythonjob`](https://github.com/aiidateam/aiida-pythonjob/)

Initially part of the `aiida-workgraph`, we recently moved this part of the code out, and into its own repository.
This is at a _very_ early stage of development, so handle with care, however, you can find the AiiDA Enhancement Proposal (AEP) [here](https://github.com/superstar54/AEP/blob/pythonjob/010_pythonjob/readme.md).
The `PythonJob` will eventually allow users to run _any_ Python function, _without modifications_.
That means, no need to pass or return subclasses of AiiDA's `orm.Data` nodes, and no specific handling of those entities inside the function body.
Just write your function, using whichever library you need, run it via `PythonJob`, and voila, you get all the AiiDA features (vide supra).
At least that's the plan &mdash; we'll make sure to keep you updated about the developments!

## Epilogue

As some of the plugins discussed in this post don't have official releases yet, their API might still change, and we cannot promise backwards-compatibility &mdash; so use them at your own risk!
However, as many of them have been in use by developers over the past years, have since been quite stable, and we think they could benefit many users, we _do_ feel comfortable to promote them to a larger audience.
Well, that's why we created this blog post!

Finally, we also added an [overview of these plugins](https://aiida.readthedocs.io/projects/aiida-core/en/latest/reference/core_plugins.html) to the latest documentation of AiiDA, which is also linked to from a new panel on the [landing page](https://aiida.readthedocs.io/projects/aiida-core/en/latest/).

Happy computing,
<br>
The AiiDA team

[^1]:
    Please note that, while developers have been using these plugins for a while to enhance their own work with AiiDA, many of them are still in a development, pre-stable release phase.
    Therefore, use them at your own risk, and please do provide us with your feedback so we can stabilize and improve them.
    As always, issues and PRs more than welcome!

[^2]:
    Not to be confused with AiiDA's `orm.Node` class. In WorkGraph, we refer to the nodes of a graph.

[^3]:
    Bonus points because the tool is written in Rust! 🦀

[^4]:
    Forgetting to set the `$AIIDA_PATH` environment variable when switching between projects &mdash; we've all been there.

[^5]:
    Which can be easily achieved via `verdi computer export <computer pk|label|uuid>` and `verdi code export <code pk|label|uuid>`.

[^6]:
    As written in the `README` of the [`aiida-code-registry`](https://github.com/aiidateam/aiida-code-registry), migration is eventually planned to the [`aiida-resource-registry`](https://github.com/aiidateam/aiida-resource-registry), which contains configuration files for [AiiDAlab](https://github.com/aiidalab/).
    Currently, the migration is still hindered, as we use `jinja2` fields for AiiDAlab, which are not yet supported for the creation of `Computer` and `Code` instances in `aiida-core` (see open issue [here](https://github.com/aiidateam/aiida-core/issues/4680)).
    For now, it is good to keep an eye open on both repositories, but we're planning to fix this soon!

[^7]:
    It's basically the necessary interface for the `diff` Linux command line utility that prints the difference between two files.
