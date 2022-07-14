---
blogpost: true
category:
tags:
date: 2017-11-20
---

# Quantum Mobile virtual machine released (v. 17.11.0)

We are releasing the first version of the ***Quantum Mobile*** Virtual Machine, supported by the MARVEL NCCR (<http://marvel-nccr.ch>) and the MaX H2020 Centre of Excellence (<http://max-centre.eu>).

You can find all instructions to [download it here](https://github.com/marvel-nccr/quantum-mobile/releases).

*Quantum Mobile* is a virtual machine based on Ubuntu Linux that comes with a collection of quantum simulation codes  (Quantum ESPRESSO, Yambo, Fleur, Siesta, cp2k).

All codes are set up and ready to be used through the AiiDA python framework for automated workflows and provenance tracking.

Quantum Mobile may be useful for exercises in physics, chemistry and materials science courses, for running quantum simulations without any setup, for experimenting with new codes, but also for managing production simulations on external supercomputers through AiiDA.

In detail, the VM comes with:

* **OS**: Ubuntu 16.04.3 LTS

* **tools**: torque, openmpi, xmgrace, gnuplot, xcrysden, jmol

* **qm codes**:

	+ Quantum ESPRESSO v6.2

	+ Yambo v4.2.0

	+ fleur v0.27 MaXR2

	+ siesta v4.0.1

	+ cp2k v5.1

* **aiida**: v0.10.0

	+ aiida-quantumespresso v1.0.0

	+ aiida-fleur v0.6.0

	+ aiida-siesta v0.9.7.1

	+ aiida-cp2k v0.2.2

	+ aiida-yambo v0.2b

* **pseudopotentials**:

	+ SSSP (PBE) accuracy

	+ SG15 ONCV v1.1
