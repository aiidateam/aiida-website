# Testimonials

A selection of testimonials from AiiDA users illustrating different use cases.
For scientific papers using AiiDA, see [here](./science.md).

**[Dr. Carlo A. Pignedoli](https://www.empa.ch/web/s205/carlo-pignedoli), Deputy Group Leader Atomistic Simulations, [nanotech@surfaces Laboratory](http://surfaces.ch/), Empa, Switzerland**

> AiiDA and the AiiDA lab have considerably reduced the human time spent on routine computational workflows in our lab, [resulting in two subsequent annual bonuses for high productivity](https://nccr-marvel.ch/highlights/2020-04AiiDAtestimonial). Experimental PhDs and Postdocs now submit workflows based on Quantum ESPRESSO through the AiiDA lab to compute the electronic properties of graphene nanoribbons, and monitor/visualize the results of more advanced workflows (e.g. NEB with CP2K, geometry optimizations, STM,STS and AFM simulations of molecules adsorbed on surfaces) submitted by their computational colleagues.

**[Dr. Atsushi Togo](https://atztogo.github.io/), lead developer of [phonopy](https://phonopy.github.io/phonopy/) and [spglib](https://spglib.github.io/spglib/), senior
researcher at National Institute for Materials Science (NIMS), Japan**

> Today’s computational materials science (in our case, force constant calculations at finite temperature, deformation twinning, etc.) usually involves workflows that combine multiple different simulation codes. AiiDA is a robust environment to write and execute such workflows (supporting high algorithmic complexity, if needed) and to inspect their results consistently. Once a workflow is written, it is straightforward to perform systematic materials simulations over the parameters of interest, which is extremely important to generate data that are durable in posterior analysis. This is fairly difficult to achieve without using AiiDA.

**Dr. Benedikt Ziebarth, Principal Scientist Materials Informatics, Schott AG, Germany**

> We at Schott are using the AiiDA environment for standardizing our workflows and thereby assure a high quality of our simulations. Due to the open plugin-driven platform approach, our internal codes and post-processing tools can be easily embedded into AiiDA workchains. Without AiiDA, making the transition from hand-driven simulation to automated calculation would have been much more difficult in the special area of glass simulations.

**Jason Yu, Ph.D. student, Department of Physics, South China University of Technology, China**

> I have been using AiiDA for a long time to manage my high-throughput calculations of optical and superconducting properties of two-dimensional materials (using Quantum ESPRESSO and VASP) and it has accelerated my academic research a lot. My fingers are liberated from tedious command line operations on remote servers and all results can easily be retrieved from the database for subsequent analysis and statistical tasks, using an integrated software solution rather than writing non-reusable scripts. Since all the steps of computation are stored in the provenance graph, I am more confident about the parameters and operational logic I used and I can easily retrieve and reproduce the calculations I performed a long time ago.

**[Dr. Pezhman Zarabadi-Poor](https://github.com/ezpzbz), Marie Skłodowska-Curie Fellow, CEITEC – MU, Czechia**

> How did I run this set of calculations and parse their result a year ago? This is a question I am asking myself quite frequently when I use AiiDA to launch a complex chain of simulations (e.g. involving CP2K, RASPA, Zeo++, and PorousMaterial), query results, or inspect failed calculations to fix the issue and re-run them. AiiDA brought this comfort and efficiency to our projects by providing a suitable framework for connecting codes through plugins in reproducible and robust workflows. These features, combined with efficient design in data/file storage, help us to not only keep the information provenance but also, to share, explore, and reproduce them anytime, anywhere. When I see intermediate calculations in a multi-stage workflow being handled in the middle of night during the weekend, I realize the efficiency bonus that AiiDA has brought to our projects.

**[Dr. Daniele Ongari](https://github.com/danieleongari), [Laboratory for Molecular Simulation](http://lsmo.epfl.ch/), EPFL Valais, Switzerland**

> When I first looked at AiiDA, I wondered: why should I put in extra effort in order to code my daily work into a framework that someone else designed? Why not keep using my bash and python scripts rather than having to learn a new tool? When I started using AiiDA, I soon realised that its 3 main advantages alone – automation, reproducibility, re-use of others’ code – are well worth the effort. Aiming for a final work chain that connects the calculations of your current project, from day one, puts you in the perspective of sharing with the scientific community not only new information, but the machine to obtain this information from scratch, allowing your successor to start from where you left.

**[Jens Bröder](https://github.com/broeder-j), Ph.D. student, Institute for Advanced Simulation (IAS), [Forschungszentrum Jülich](https://www.fz-juelich.de/), Germany**

> We have followed the evolution of AiiDA from 2015, using it together with [FLEUR](https://www.flapw.de/) and other JuDFT simulation programs at the Forschungszentrum Jülich and beyond. Without AiiDA’s provenance tracking it would have been much harder to ensure that data is reproducible and to create a larger database for the evaluation of XPS spectra during my PhD. While profiting from the rich, growing open source material informatics ecosystem and enjoying the very nice, ever helpful community around AiiDA, I do believe that together we can now bring full-scale virtual materials design to life and make a difference.

Literature references
---------------------

**Malcolm Sim; The Dynamic Orchestration of Self-Driving Laboratories. Master's thesis, University of Toronto, 2024.** [Availabe from](https://tspace.library.utoronto.ca/bitstream/1807/138140/2/Sim_Malcolm_202403_MSc_thesis.pdf)
> \[…\] To tackle the computational challenges and ensure reproducibility, ChemOS 2.0 embraces the integration of the AiiDA software package. AiiDA plays a critical role in automating data transfers between the user’s local environment and the high-performance supercomputing cluster. […\] Additionally, AiiDA is prepared for distributed computing, enabling efficient utilization of computational resources.

**Foscato, M.; Jensen, V. R. Automated in Silico Design of Homogeneous Catalysts. ACS Catal. 2020, 10 (3), 2354–2377.** [10.1021/acscatal.9b04952](https://doi.org/10.1021/acscatal.9b04952)

> \[…\] Such reuse and repurposing may be realized by making sure that workflow managers such as AiiDA, QMflows, AFlow, Signac, and FireWorks prepare job summaries in standardized data formats used by the community repositories. The most detailed management control is currently offered by AiiDA which keeps track of the complete history, including information on methods, input parameters, computer, postprocessing tools, and dependencies, leading to a computational result, thereby mapping the complete data provenance necessary to ensure reproducibility and repurposing. \[…\]

**Zhang, Y. et al. DP-GEN: A Concurrent Learning Platform for the Generation of Reliable Deep Learning Based Potential Energy Models. Computer Physics Communications 2020, 107206.** [10.1016/j.cpc.2020.107206](https://doi.org/10.1016/j.cpc.2020.107206)

> \[…\] Moreover, there have been significant efforts to build automatic interactive platforms for computational science. Among these efforts, the AiiDA package has become very promising for creating social ecosystems to disseminate codes, data, and scientific workflows. To connect DP-GEN with popular general-purpose open-source platforms is on our to-do list. \[…\]

**Giessen, E. et al. Roadmap on Multiscale Materials Modeling. Modelling Simul. Mater. Sci. Eng. 2020, 28 (4), 043001.** [10.1088/1361-651X/ab7150](https://doi.org/10.1088/1361-651X/ab7150)

> \[…\] The ability to reproduce work is critical for the self-correcting mechanism of Science as explained above. It is also of great value to researchers themselves. Experimentalists are famous for maintaining meticulous lab notebooks that help them keep track of the large number of experiments (many unreported) that are necessary in order to understand a problem and obtain high-quality results. The field of molecular simulation (and simulations in general) do not have a similar culture. Students are typically not taught how to maintain order among the large numbers of preliminary simulations that they perform. Numerical simulations leave a wake of directories full of inputs and outputs with little or no documentation. Even the researcher who did the work (let alone other researchers) will find it difficult (and sometimes impossible) to go back to an earlier step, understand what was done, and reproduce the results. This culture is beginning to change with the emergence of workflow management tools such as AiidA and Jupyter. These tools make it possible to document a simulation and in principle reproduce it . \[…\]
