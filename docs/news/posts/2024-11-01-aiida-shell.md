---
blogpost: true
category: Blog
tags: calculations, simplicity, prototyping
author: Sebastiaan Huber
date: 2024-11-01
---

# `aiida-shell`: Make running programs through AiiDA a piece of cake

Historically, to run any external program through AiiDA, a set of plugins is required.
Plugins are pieces of Python code that would instruct AiiDA how to write the inputs files of the target program, and how to parse the outputs.
Having to write these plugins is not trivial for new users and it notoriously increases the learning curve of AiiDA.
But even for experienced users, being forced to write plugins for each new program, severly slows down the speed of development and makes prototyping difficult.

Over the years, the AiiDA community has put forward great work to build up a collection of publicly available plugins that are indexed on the [AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/).
This enables users to get a way quicker start if their target program happens to have an available plugin.
But there will always be programs that are not yet supported and so the problem remains.

Enter [`aiida-shell`](https://aiida-shell.readthedocs.io/en/latest):

![AiiDA shell](https://aiida-shell.readthedocs.io/en/latest/_images/logo-text.svg)

`aiida-shell` is a package designed to run any program with a command line interface through AiiDA without having to write a single plugin.
This makes getting started with AiiDA a lot easier and makes prototyping lightning fast!
This blog post first explains the basic concept of `aiida-shell` and then demonstrates how it works in practice by going step-by-step through a real scientific use case.

## Installation

If you want to follow along interactively and actually run the code examples in the following parts, you will have to install `aiida-shell`.
Make sure you have a recent version of Python installed and then install the package with `pip`:

```console
pip install aiida-shell
```

If the installation is successful, you can [create an AiiDA profile](https://aiida.readthedocs.io/projects/aiida-core/en/v2.6.2/installation/guide_quick.html#quick-installation-guide) with:

```console
verdi presto
```

If there are no error messages, you should now be good to go to follow the rest of the examples.
You can either add the snippets to a file, e.g. `script.py`, and run it with `verdi run script.py`.
Or you can open an interactive shell with `verdi shell`, and run the commands interactively.

## The basic concept

All that is needed to run any program with `aiida-shell` is its `launch_shell_job` function:

```python
from aiida_shell import launch_shell_job
results, node = launch_shell_job('date')
print(results['stdout'].get_content())
```

In the snippet above, the [`date` program](https://www.man7.org/linux/man-pages/man1/date.1.html) is used as an example, which is a simple Linux utility that prints the current date.
The program is simply passed as a string to the `launch_shell_job` function.
Under the hood, `aiida-shell` will find the location of this executable and write the necessary plugins on-the-fly.
It then runs the code (on the `localhost` Computer) as one would normally do with AiiDA, and the outputs are parsed.
The output produced by the code that was written to stdout can be retrieved from the results under the `stdout` key.

This is the most basic example and it is rare that a program does not require any inputs.
Any arguments that the program takes, can easily be specified with the `arguments` argument as follows:

```python
from aiida_shell import launch_shell_job
results, node = launch_shell_job(
    'date',
    arguments='--iso-8601'
)
print(results['stdout'].get_content())
```

which should print something like `2022-03-17`.
There is a lot more functionality that is supported.
If you want to learn more, the [how-to guides of the online documentation](https://aiida-shell.readthedocs.io/en/latest/howto.html) are an excellent place to get an overview of the available features.

## Real life scientific use case

To make the usefulness and power of `aiida-shell` more concrete, let's now go through a real life use case.
In the following, we will compute the electronic band structure of gallium arsenide using Quantum ESPRESSO.
[Quantum ESPRESSO](https://www.quantum-espresso.org/) is a free and Open-Source integrated suite of computer codes for electronic-structure calculations and materials modeling at the nanoscale.

The workflow consists roughly of four calculations:

1. Computing the charge density of the system self-consistently
2. Computing the electronic structure along high-symmetry k-points
3. Post-processing the data to extract the electronic band structure
4. Plot the electronic band structure

Quantum ESPRESSO employs pseudopotentials to describe the effective potential of the system.
Each calculation requires a pseudopotential for each element that is part of the system.
For this example, we will use the pseudopotentials provided on the [website of Quantum ESPRESSO itself](https://pseudopotentials.quantum-espresso.org/legacy_tables/ps-library).
To make them available to the calculations, we download and store them in a `FolderData` node:

```python
#!/usr/bin/env runaiida
"""Simulation of electronic band structure of GaAs using Quantum ESPRESSO."""
import urllib.request

from aiida import engine, orm
from aiida_shell import launch_shell_job

# Generate a folder with the required pseudopotentials
url_base = 'https://pseudopotentials.quantum-espresso.org/upf_files/'
pseudos = orm.FolderData()

with urllib.request.urlopen(f'{url_base}/Ga.pbe-dn-kjpaw_psl.1.0.0.UPF') as handle:
    pseudos.put_object_from_filelike(handle, 'Ga.UPF')

with urllib.request.urlopen(f'{url_base}/As.pbe-n-kjpaw_psl.1.0.0.UPF') as handle:
    pseudos.put_object_from_filelike(handle, 'As.UPF')
```

The next step is to launch the the self-consistent calculation.
Below we define the input script using the Quantum ESPRESSO input format:

```python
script_scf = """\
&control
    calculation = 'scf'
    prefix = 'output'
    pseudo_dir = './pseudo/'
/
&system
    ibrav = 2
    nat = 2
    ntyp = 2
    celldm(1) = 10.86
    ecutwfc = 60
    ecutrho = 244
/
&electrons
/
ATOMIC_SPECIES
    Ga 69.72 Ga.UPF
    As 74.92 As.UPF
ATOMIC_POSITIONS
    Ga 0.00 0.00 0.00
    As 0.25 0.25 0.25
K_POINTS {automatic}
    8 8 8 0 0 0
"""
```

Besides the input script itself, the calculation requires the pseudopotentials that we downloaded earlier.
We instruct `aiida-shell` to copy them to the working directory by adding the `FolderData` with pseudos to the `nodes` dictionary:

```python
results_scf, node_scf = launch_shell_job(
    'pw.x',
    arguments='-in {script}',
    nodes={
        'script': orm.SinglefileData.from_string(script_scf),
        'pseudos': pseudos,
    },
    filenames={
        'pseudos': 'pseudo',
    },
    outputs=['output.xml', 'output.save'],
)

```

Quantum ESPRESSO's `pw.x` code does not expect the location of the pseudopotentials as a command line argument, so we don't have to add a placeholder for this node in the `arguments` input.
However, the input script does define the `CONTROL.pseudo_dir` setting, which allows to specify the location of the pseudopotentials.
In the script, this was set to `./pseudo`, so we need to make sure that the content of the `pseudos` node are copied to that subdirectory.
This is accomplished using the `filenames` input where we define the relative filepath target for the `pseudos` node.
As outputs, we expect the `output.xml` file and the `output.save` directory.

The next step is to compute the electronic structure along high-symmetry k-points.
Below we define the input script, where the only real difference is the explicit definition of the number of bands in `SYSTEM.nbnd` and the definition of the `K_POINTS`:

```python
script_nscf = """\
&control
    calculation = 'bands'
    prefix = 'output'
    pseudo_dir = './pseudo/'
/
&system
    ibrav = 2
    nat = 2
    ntyp = 2
    celldm(1) = 10.86
    ecutwfc = 60
    ecutrho = 244
    nbnd = 16
/
&electrons
/
ATOMIC_SPECIES
    Ga  69.72 Ga.UPF
    As  74.92 As.UPF
ATOMIC_POSITIONS
    Ga 0.00 0.00 0.00
    As 0.25 0.25 0.25
K_POINTS {crystal_b}
5
    0.000 0.50 00.000 20 !L
    0.000 0.00 00.000 30 !G
   -0.500 0.00 -0.500 10 !X
   -0.375 0.00 -0.675 30 !K,U
    0.000 0.00 -1.000 20 !G
"""
```

The NSCF calculation requires the results of the SCF calculation, which were written to the `output.save` directory.
The SCF calculation registered this folder as an output and so its contents were retrieved as a `FolderData` and attached as an output node.
This node, retrieved from the results dictionary of the SCF calculation `results_scf['output_save']`, is passed as an entry in the `nodes` input:

```python
results_nscf, node_nscf = launch_shell_job(
    'pw.x',
    arguments='-in {script}',
    nodes={
        'script': orm.SinglefileData.from_string(script_nscf),
        'pseudos': pseudos,
        'results_scf': results_scf['output_save'],
    },
    filenames={
        'pseudos': 'pseudo',
        'results_scf': 'output.save',
    },
    outputs=['output.xml', 'output.save'],
)
```

In this manner, `aiida-shell` easily allows chaining multiple simulations together, keeping provenance of the full workflow. With the bands computed, we need to extract them from the `output.save` directory in a format that allows them to be plotted.
Quantum ESPRESSO provides the `bands.x` utility exactly for this purpose:

```python
script_bands = """\
&bands
    prefix = 'output',
    filband = 'bands.dat',
    lsym = .true.
/
```

Once again, we provide the contents of the `output.save` directory, this time from the NSCF calculation, which were attached as a `FolderData` node to the outputs:

```python
results_bands, node_bands = launch_shell_job(
    'bands.x',
    arguments='-in {script}',
    nodes={
        'script': orm.SinglefileData.from_string(script_bands),
        'results_nscf': results_nscf['output_save'],
    },
    filenames={
        'results_nscf': 'output.save',
    },
    outputs=['bands.dat.gnu'],
)
```

The `bands.x` utility will write the bands data to a file named `bands.dat.gnu` which is registered as an output.
This file, which will be attached as a `SinglefileData` node to the outputs, can be used together with the `stdout` content to plot the computed electronic band structure:

```python
def plot_bands(bands: orm.SinglefileData, stdout_scf: orm.SinglefileData) -> orm.SinglefileData:
    """Plot the band structure."""
    import io
    import re

    import matplotlib.pyplot as plt
    import numpy as np

    with bands.as_path() as filepath:
        data = np.loadtxt(filepath)

    kpoints = np.unique(data[:, 0])
    bands = np.reshape(data[:, 1], (-1, len(kpoints)))
    xticks = [0, 0.8660, 1.8660, 2.2196, 3.2802]
    xlabels = ['L', r'$\Gamma$', 'X', 'U', r'$\Gamma$']

    fermi_energy = re.search(r'highest occupied level \(ev\):\s+(\d+\.\d+)', stdout_scf.get_content()).groups()[0]
    plt.axhline(float(fermi_energy), color='black', ls='--', lw=0.5, alpha=0.5)

    for band in bands:
        plt.plot(kpoints, band, color='black', alpha=0.5)

    for tick in xticks[1:-1]:
        plt.axvline(tick, color='black', ls='dotted', lw=0.5, alpha=0.5)

    plt.xlim(min(kpoints), max(kpoints))
    plt.xticks(ticks=xticks, labels=xlabels)
    plt.ylabel('Energy (eV)')

    stream = io.BytesIO()
    plt.savefig(stream, format='png', bbox_inches='tight', dpi=180)
    stream.seek(0)

    return orm.SinglefileData(stream, filename='bands.png')


# Create the electronic band structure plot
results = plot_bands(node_bands.outputs.bands_dat_gnu, node_scf.outputs.stdout)
print(results)
```

The resulting PNG file will look something like the following:

![band structure](https://aiida-shell.readthedocs.io/en/latest/_images/band_structure.png)

So far, we have been following the [advanced example of the online documentation](https://aiida-shell.readthedocs.io/en/latest/examples/qe.html#examples-qe).
We will stop here, but the online example goes further to show how the codes can be run with MPI and on remote computers.

This was a quick introduction in `aiida-shell`.
Hopefully it has made clear how it can make using AiiDA a lot easier and faster to prototype.
As always, any questions are more than welcome on [AiiDA's Discourse forum](https://aiida.discourse.group/).
If you encounter any bugs, or you have great ideas for additional features, feel free to open an issue on the [Github repository](https://github.com/sphuber/aiida-shell/issues).

Happy computing!
