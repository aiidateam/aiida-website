```{toctree}
:hidden:
News <news/index.md>
Team <team.md>
More <more/index.md>
```

# Latest news

```{postlist} 5
:list-style: none
:date: "%A, %B %d, %Y"
:excerpts:
:expand: Read more ...
```

# What is AiiDA?

```{highlights}
AiiDA is an open-source Python infrastructure to help researchers with automating, managing, persisting, sharing and reproducing the complex workflows associated with modern computational science and all associated data.
```

AiiDA is built to support and streamline the four core pillars of the [ADES model](https://arxiv.org/abs/1504.01163): Automation, Data, Environment, and Sharing. Key features include:

- **Workflows**: AiiDA allows to build and execute complex, auto-documenting workflows linked to multiple codes on local and remote computers.
- **High-throughput**: AiiDA’s event-based workflow engine supports tens of thousands of processes per hour with full check-pointing.
- **Data provenance**: AiiDA automatically tracks and records inputs, outputs and metadata of all calculations and workflows in extensive provenance graphs that preserve the full lineage of all data.
- **Advanced queries**: AiiDA’s query language enables fast graph queries on millions of nodes.
- **Plugin interface**: AiiDA can support via plugins any computational code and data analytics tool, data type, scheduler, connection mode, etc. (see [public plugin repository](https://aiidateam.github.io/aiida-registry/))
- **HPC interface**: AiiDA can seamlessly deal with heterogeneous and remote computing resources; it works with many schedulers out of the box (SLURM, PBS Pro, torque, SGE or LSF).
- **Open science**: AiiDA allows to export both full databases and selected subsets, to be shared with collaborators or made available and browsable online on the [Archive](https://archive.materialscloud.org/) and [Explore](https://www.materialscloud.org/explore) sections of [Materials Cloud](https://www.materialscloud.org/).
- **Open source**: AiiDA is released under the MIT open-source license.
