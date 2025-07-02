---
blogpost: true
category: News
tags: article
date: 2025-05-26
---

# Preprint published: A Python workflow definition for computational materials design

We're excited to announce the submission of our [paper preprint](https://arxiv.org/abs/2505.20366) titled "A Python workflow definition for computational materials design" to arXiv.

In this joint effort, together with developers from the [pyiron](https://github.com/pyiron) and [jobflow](https://github.com/materialsproject/jobflow) workflow managers, we define a common format that allows sharing workflows between the different frameworks.

To achieve this, the following three workflow ingredients are required:
1. a conda environment that specifies the software dependencies,
1. a Python module that contains the Python functions represented as nodes in the workflow graph, and
1. a workflow graph stored in the JavaScript Object Notation (JSON).

This means that, a workflow defined by the execution of Python functions, can therefore be:
1. transformed into any of the workflow representations provided by the three worfklow managers (aiida, jobflow, pyiron),
1. exported to the common, shared format, and, finally,
1. executed by any of the other workflow managers.

On our side, this has been made possible by the [`aiida-workgraph`](https://github.com/aiidateam/aiida-workgraph/) package, that allows for the flexible and dynamic construction of AiiDA workflows.
You can find the code and documentation in the corresponding `Python Workflow Definition` [GitHub organization](https://github.com/pythonworkflow).

Happy computing!

The AiiDA team
