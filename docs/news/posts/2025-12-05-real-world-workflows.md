---
blogpost: true
category: Blog
tags: demo, materials science
author: Julian Geiger, Kristjan Eimre, Michail Minotakis, Natalyia Paulish, Ali Khosravi, Miki Bonacci
date: 2025-12-05
---

# Real-world workflows: Zero to hero


This tutorial provides a comprehensive guide to setting up and running real-world materials science calculations using AiiDA with Quantum ESPRESSO. We'll walk through the complete process from installation to running advanced workflows for relaxation, phonons, and more.

## Common setup

Before diving into specific workflows, we need to set up the AiiDA environment. This section will guide you through installing AiiDA, the Quantum ESPRESSO plugin, configuring computational resources, and setting up codes.

### Installing AiiDA and the Quantum ESPRESSO plugin

Installing AiiDA and getting started is now incredibly simple! Just run:

```console
$ pip install aiida-core aiida-quantumespresso
$ verdi presto
```

That's it! The `verdi presto` command creates a profile with everything you need to get started:
- A SQLite database to store your data
- A file repository for calculation outputs
- Ready-to-use configuration

To verify the installation was successful:

```console
$ verdi status
```

All lines should show a green checkmark ✓. If you see any red crosses, refer to the [troubleshooting guide](https://aiida.readthedocs.io/projects/aiida-core/en/latest/installation/troubleshooting.html).

You can check your profiles anytime with:

```console
$ verdi profile list
```

The profile marked with `*` is your default profile, which will be used for all `verdi` commands unless you specify otherwise.

:::{note}
For production use with high-throughput calculations, you may want to set up PostgreSQL and RabbitMQ for better performance. For this tutorial and most workflows, the quick installation is perfectly sufficient!
:::

### Setting up codes

The `aiida-quantumespresso` plugin provides a convenient command to set up multiple Quantum ESPRESSO codes at once. Simply run:

```console
$ aiida-quantumespresso setup codes localhost pw.x ph.x projwfc.x dos.x
```

This command will:
1. Look for the executables in your `PATH`
2. Create AiiDA `Code` entries for each executable
3. Configure them to run on `localhost`

The setup will automatically find the executables using the `which` command. Verify your codes are set up correctly:

```console
$ verdi code list
```

You should see entries like `pw@localhost`, `ph@localhost`, `projwfc@localhost`, and `dos@localhost`.

### Installing pseudopotentials

Quantum ESPRESSO calculations require pseudopotentials. Install the SSSP (Standard Solid State Pseudopotentials) library:

```console
$ aiida-pseudo install sssp
```

This downloads and installs the SSSP library. Verify the installation:

```console
$ verdi group list
```

You should see entries like `SSSP/1.3/PBEsol/efficiency` and `SSSP/1.3/PBEsol/precision`.

:::{tip}
The SSSP library provides two levels of accuracy:
- **efficiency**: Faster calculations, suitable for initial screening
- **precision**: Higher accuracy, use for production results
:::

### Verifying your setup

Before running workflows, let's verify everything is set up correctly with a simple test calculation:

```python
from aiida import orm, engine
from aiida.plugins import WorkflowFactory
from ase.build import bulk

# Load the PwBaseWorkChain
PwBaseWorkChain = WorkflowFactory('quantumespresso.pw.base')

# Load your code
code = orm.load_code('pw@localhost')

# Create a simple structure (silicon)
structure = orm.StructureData(ase=bulk('Si', 'fcc', 5.43))

# Use the protocol to get a pre-configured builder
builder = PwBaseWorkChain.get_builder_from_protocol(
    code=code,
    structure=structure,
    protocol='fast',
    overrides={}
)

# Submit the calculation
print("Submitting test calculation...")
workchain = engine.submit(builder)
print(f"Submitted WorkChain<{workchain.pk}>")
```

Save this to a file (e.g., `test_setup.py`) and run it:

```console
$ verdi run test_setup.py
```

Monitor the calculation:

```console
$ verdi process list
```

### Complete setup in one go

Here's a complete setup script that you can copy and adapt for your system:

```bash
#!/bin/bash
# Complete AiiDA + Quantum ESPRESSO setup

# Install packages
pip install aiida-core aiida-quantumespresso

# Initialize AiiDA with verdi presto
verdi presto

# Setup Quantum ESPRESSO codes (automatically finds them in PATH)
aiida-quantumespresso setup codes localhost pw.x ph.x projwfc.x dos.x q2r.x matdyn.x

# Install pseudopotentials
aiida-pseudo install sssp

# Start the daemon
verdi daemon start

# Verify everything works
verdi status
verdi code list

echo "✅ AiiDA setup complete!"
```

Save this as `setup.sh`, make it executable, and run:

```console
$ chmod +x setup.sh
$ ./setup.sh
```



#### Tab completion for verdi

To make working with `verdi` easier, enable tab completion:

### Quick tips

#### Enable tab completion

Make working with `verdi` easier by enabling tab completion:

```bash
# For bash
eval "$(_VERDI_COMPLETE=bash_source verdi)"

# For zsh  
eval "$(_VERDI_COMPLETE=zsh_source verdi)"
```

Add this to your `~/.bashrc` or `~/.zshrc` to enable it permanently.

#### Useful verdi commands

```console
# Check overall status
$ verdi status

# List all processes
$ verdi process list -a

# Show details of a specific calculation
$ verdi process show <PK>

# View calculation outputs
$ verdi calcjob outputcat <PK>

# Monitor daemon logs
$ verdi daemon logshow
```


### Next steps

With your environment properly configured, you're ready to run real-world workflows! The following sections will cover:

- **Relaxation workflows**: Optimizing crystal structures
- **Phonon calculations**: Computing vibrational properties
- **Wannierization**: Generating Wannier functions (e.g. for interpolated band structure)

Each workflow builds on this common setup, so make sure everything is working before proceeding.

## Relaxation

*Coming soon...*

## Phonon workflow

*Coming soon...*

## Automatic wannierization

*Coming soon...*
