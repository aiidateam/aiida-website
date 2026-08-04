---
title: "Teaching AiiDA to Speak Human: GSoC 2026 Journey Begins"
date: 2026-05-26
author: Jaweria Batool
category: Blog
tags: [gsoc, aiida, ai, gsoc2026]
---

## What I Am Building

The project is a **natural language interface for AiiDA** built on a multi-agent AI architecture.
Various specialized agents handle different parts of the interaction, among others: an Orchestrator that routes the user's intent, a Workflow Agent that submits jobs, a Config Agent that builds simulation parameters, a Diagnostic Agent that interprets calculation failures, and an Analysis Agent that queries results from AiiDA's provenance graph.

The agents connect to AiiDA through an MCP (Model Context Protocol) server that exposes AiiDA's Python API as typed, validated tools.
This means the AI never directly calls AiiDA or writes arbitrary Python code.
Instead, every action goes through a defined interface with input validation.
That matters because wrong parameters on a supercomputer job waste compute time, and catching errors before submission is much cheaper than catching them after.

Before anything gets submitted to an HPC cluster, the scientist sees the generated parameters and confirms.
This is because AI can produce inputs that look correct but are physically nonsensical, thus, a human confirmation step is a necessary safeguard here.

## Community bonding: what I have been up to

Coding starts May 25, but I have been working through the AiiDA codebase since the community bonding period opened.

The first week was spent entirely on AiiDA fundamentals, installing it on WSL (Windows Subsystem for Linux), running the basic tutorial, and working through concepts I had no prior exposure to: provenance graphs, WorkChains, CalcJobs, QueryBuilder.
The mental model is different from what I was used to.
In my previous agentic projects I controlled the data flow explicitly.
In AiiDA, the framework manages it, and you work within its structure.

The provenance graph was the concept that clicked most clearly.
Every input, output, and calculation is stored permanently and linked together, to produce a complete record of how every result was obtained.
When I ran `verdi node graph generate` and saw the WorkChain laid out visually, inputs flowing in, processes running, outputs coming back, it gave me a much more concrete picture of what the Analysis Agent will be querying.
I also went through the `PwBaseWorkChain` and `PwRelaxWorkChain` some of the target Quantum ESPRESSO workflows of the project.

On the communication side: I joined the AiiDA Slack workspace, attended the biweekly team meeting, and met with the mentors and development team.
The team is small and technically sharp.
Mentors will be guiding the AiiDA domain side; I bring the AI systems knowledge.
That division makes sense given what the project needs.

## What Comes Next

The next phase of the project will focus on building the MCP integration layer and establishing reliable communication between the agents and AiiDA workflows.

The principle I am going in with: get one thing working end-to-end before adding more.
One agent reliably talking to AiiDA through MCP is worth more at this stage than multiple agents partially working.
Build the foundation, then expand.

The harder part will be the Quantum ESPRESSO domain knowledge, valid parameter ranges, which inputs matter for which calculation types, and what the outputs actually mean.
That is where the team's expertise becomes essential.
The project is genuinely collaborative, which is what makes it interesting.

---

## Weeks 1 & 2: setting up the MCP tools and the first agent

Following the end of the community bonding period, the first official coding weeks kicked off with a mix of high-level architecture alignment and hands-on tool development.

### Alignment and planning

To align on the project structure, I discussed with the mentor and we also had a dedicated session with the group leader at PSI and AiiDA's original creator, Giovanni Pizzi.
We discussed project timeline, and the specific modules to be included in our architecture.
Having this high-level feedback early on was extremely valuable for mapping out how the agents will interact with AiiDA's database.

### Setting up the MCP tools

With the architecture aligned, the first concrete technical task was to build the Model Context Protocol (MCP) server tools for AiiDA.
We decided it was cleaner to build on `aiida-restapi`, an external package that already provides the filtering, pagination, and projection logic we would otherwise have written ourselves on top of `aiida-core`'s `orm` and `QueryBuilder`.
We wanted to import and call these Pydantic models in-process, without standing up a live web server, to serve as clean building blocks for our tool schema.

However, the initial integration was not smooth.
We ran into compatibility issues and errors where the existing REST API code wasn't quite working for our needs.
This was mainly due to a recent rework of the use of pydantic in AiiDA's `orm` module in [PR #6990](https://www.github.com/aiidateam/aiida-core/pull/6990) that required changes to `aiida-restapi` that were still under review.
By pulling in the latest updates and pull requests from the `aiida-restapi` repository, we managed to integrate it and make the tool schemas work.

Through this process, we refined our tool-design strategy:

- For querying collections of nodes, we use the `NodeService` wrapper from `aiida-restapi`.
- For simple single-node operations (like fetching attributes of an already-loaded node), we call `aiida-core`'s ORM directly, which is simpler than adding an unnecessary layer of `aiida-restapi` indirection.

With this foundation, I built and defined the first six MCP tools for our server.

### Collaborative feedback

A highlight of these past two weeks has been the close collaboration with the mentor.
We did what felt like asynchronous pair programming; after developing the tools on a separate branch, I opened the pull request on GitHub.
This collaboration was incredibly active and considerate, providing detailed, constructive feedback on the design.
We went through the review process, made necessary adjustments, and successfully refined the pull request.

### Initial agent configuration

With the tool layer taking shape, I also started setting up the initial configuration for the agents.
Getting the analysis agent configured early is critical so that we can begin testing end-to-end interactions with our newly created tools.
Laying this groundwork now ensures we stay on track with our GSoC timeline.

---

## Weeks 3 & 4: grounding the Analysis Agent in the AiiDA docs

With the MCP tools landed and the Analysis Agent configured, the next gap was obvious.
The agent could query the provenance graph through the MCP tools, but it had no way to answer a question like "what is the difference between a CalcJobNode and a WorkChainNode?"
That kind of question is not a database query, it is a documentation question, and the base model's general knowledge on AiiDA-specific terminology is thin and prone to hallucination.
So weeks 3 & 4 were spent building a retrieval-augmented generation (RAG) pipeline over the official AiiDA documentation, and wiring it into the Analysis Agent as a new tool.

### Keeping it local

The project's local-first constraint, no required cloud vendor, for cost, privacy, and control reasons, applies just as much to retrieval as it does to the model itself.
That ruled out OpenAI or Cohere embeddings outright, since either would reintroduce the exact vendor dependency we are trying to avoid.
So both the embedding model and the vector store needed to run locally, with no subscription and no API key.

### From raw docs to clean chunks

The first attempt parsed the raw RST and Markdown files straight out of `aiida-core`.
This was a mistake.
The chunks came out full of unresolved `:ref:` directives, `.. include::` references that were never expanded, and RST markup that an embedding model has no way to interpret.
Retrieval on these chunks was poor.

After checking with the mentor, the fix was to run `sphinx-build -b text` on the docs source instead, which resolves every directive and include and leaves plain prose behind.
The corpus is pinned to `aiida-core v2.8.0` so it stays version-matched, and is cached separately from the vector index, so swapping embedding models later does not mean re-cloning and re-building the docs from scratch.
Each `.txt` file is split into heading and body pairs, with long sections recursively split at paragraph, then line, then sentence boundaries, up to roughly 2,000 characters per chunk.
Sections under 150 characters are dropped as noise.
The full v2.8 docs came out to 1,111 chunks at around 1,100 characters each.

One more thing had to be filtered out by hand: the changelog.
It is high-volume, low-conceptual-value text, and it was outranking the real concept pages — it landed at rank one for "What is a CalcJobNode?", which is exactly the question this pipeline exists to answer.
Release notes and the API reference are both excluded from the corpus now for the same reason.

### Picking an embedding model

The default choice, `nomic-embed-text`, did not work for this domain.
It scored a KpointsData query at 0.67 against an unrelated chunk scoring 0.77, which is close to random.
The root cause turned out to be missing task prefixes, but even after adding those back in, retrieval on AiiDA-specific terms stayed weak.

`mxbai-embed-large`, served locally through Ollama, performed noticeably better on this kind of technical retrieval and currently sits near the top of the MTEB benchmark.
It has its own quirk: no prefix at index time, but a fixed prefix added at query time, which `OllamaEmbedding.embed_query()` now handles automatically so nothing upstream has to think about it.
A `sentence-transformers/all-MiniLM-L6-v2` fallback is selected automatically when Ollama is unreachable, which matters for CI and for anyone developing offline.

Getting the embedding calls working at all surfaced a smaller bug.
The original code called Ollama's old `/api/embeddings` endpoint with a `prompt` field, and newer Ollama versions reject that outright with HTTP 500 errors.
The fix was switching to `/api/embed` with a list-based `input` field, which also batches natively, so embedding calls are now sub-batched at ten texts per request to stay comfortable on CPU-only hardware.

### Wiring it into the agent

The embeddings land in a persistent local ChromaDB collection, keyed by both the docs version and the embedding model, since a collection built with `mxbai` at 1024 dimensions cannot be queried with `MiniLM` at 384.
A version bump or a backend change now triggers a rebuild instead of silently serving back a stale or dimension-mismatched index.

The retriever itself is exposed as a single function, `search_aiida_docs(query)`, registered directly in the Analysis Agent's tool list.
That brings the agent to seven tools, six for querying the provenance graph and structures, and this one for grounding conceptual answers in the actual documentation.

### Review and merge

As with the MCP tools in the last update, this went through the same close back-and-forth with the mentor: branch, pull request, detailed review, revisions, merge.
By the end of these two weeks the Analysis Agent could do both halves of its job in one conversation, pulling facts from the provenance graph through the MCP tools and explanations from the documentation through RAG, end to end, reviewed, and running.

---

## Weeks 5 & 6: closing the write path and hardening the infrastructure

With the Analysis Agent reading reliably from the provenance graph, the natural next step was closing the other half of the loop: letting it write.
Not freely, and not without a safeguard, but write nonetheless.

### The write path and human confirmation

The core deliverable for these two weeks was `submit_workflow`, a tool that takes an entry point and a set of inputs, validates them, and submits a calculation or workflow to AiiDA.
The validation step matters more than it might seem.
The agent resolves the user's natural language inputs into AiiDA node references, but the model can hallucinate, pass wrong types, or omit required ports entirely.
Rather than letting a bad submission reach the database, the resolved inputs are first validated against the process's own input spec, exactly as AiiDA would at submit time, catching structural errors before the user is ever asked.

The human confirmation step was the other non-negotiable piece.
Every submission the agent proposes pauses the run and surfaces a preview, showing the resolved entry point and the actual node types the agent is about to write, not the raw arguments it was given.
Throughout development the running example was `core.arithmetic.add`, a toy CalcJob that adds two numbers and takes three inputs: a `code`, `x`, and `y`.
For such a call the user sees `InstalledCode(pk=1)`, `Int(value=5)`, and `Int(value=7)`, not `{"code": {"pk": 1}, "x": 5, "y": 7}`.
Only an explicit yes proceeds.
This is enforced structurally: `submit_workflow` is registered with `requires_approval=True`, so pydantic-ai returns a `DeferredToolRequests` object before executing anything.
There is no code path that writes to the database without passing through that gate.
A regression test proves it.

One subtlety surfaced during dogfooding.
Each calculation plugin declares defaults for its optional ports in its own process spec (its `define()` method), and `pre_process` fills them in.
`core.arithmetic.add`, for example, sets a default `metadata.options.resources` of `{num_machines: 1, num_mpiprocs_per_machine: 1}`, so the user never has to spell it out.
Validating before `pre_process` was stricter than the engine itself, rejecting submissions that AiiDA would have happily accepted and forcing the user to spell out boilerplate options by hand.
The fix was to fill in those defaults before validating, the same way the engine does at submit time, so the check sees the user's inputs together with AiiDA's own defaults rather than the bare inputs alone.

A second issue came from SQLAlchemy's session-per-thread model, which AiiDA's storage backend uses: each thread gets its own database session, and an ORM object is tied to the session that loaded it.
Building the approval preview resolves the agent's inputs into AiiDA nodes on the main thread, binding those objects (the default user, the resolved input nodes) to the main thread's session.
The first design then performed the write by re-running the agent, but pydantic-ai runs sync tools on a worker thread, so reusing those main-thread objects from the worker thread raised a cross-thread SQLAlchemy error.
The fix was to run the confirmed submission directly on the main thread, right after the user approves, so the worker thread never touches the database at all.

### Refactoring, configuration, and the REPL

The write path work exposed a structural issue that had been there since the beginning.
The tool functions lived under `mcp/`, which was the right home when they only served the MCP server.
With the agent now also calling them directly, the `mcp/` namespace was the wrong one.
The tools were lifted into a new surface-agnostic `tools/` layer, shared cleanly between the MCP server and the agent without either owning the other.

Two configuration gaps were fixed alongside this.
The `max_tokens` setting had no way to be controlled from the environment, which meant long tool-calling runs could be silently truncated.
A `context_length` knob was added for Ollama specifically, sent as `num_ctx` per request so the context window is opt-in rather than a hidden default.
Both live in `ModelSettings` and are validated against each other at startup, so a budget that cannot fit inside its own window fails fast with a clear message rather than silently misbehaving mid-run.

The REPL also got a proper overhaul.
The bare `input()` loop was replaced with `prompt_toolkit`, giving the session persistent history across restarts via an XDG-compliant file, arrow-key and `Ctrl-R` recall, real multiline editing, and emacs-style line keys.
The `rich` library replaced the hand-rolled threading spinner.
History is now capped on turn boundaries rather than raw message count, which matters because slicing mid-turn orphans a tool call that providers then reject.
The mentor updated the README with a demo of the current state.

### Cloud model access

Local-only had been the constraint from day one, but testing against the RAG and write-path changes made its cost obvious: small local models produced unreliable answers, and the larger local models capable enough to compete with cloud models were too slow for practical iteration.
So for evaluation and development speed, cloud access became necessary, while keeping the local path fully intact as the default.

Towards the end of these two weeks, OpenRouter support landed as a first-class provider, sitting alongside Ollama, OpenAI, and Anthropic in the model factory.

### Where things stand

At the end of week six the agent can read from the provenance graph, answer conceptual questions from the documentation, and submit calculations with validated inputs and enforced human confirmation.
The infrastructure is solid enough to start real testing.
That is what the next phase is for.

---

## Weeks 7 & 8: From theory to reality

After the midterm evaluation wrapped up, the project shifted in an important way.
I stopped polishing infrastructure and started testing against real data.

The mentor provided a real AiiDA archive of roughly 340,000 nodes, containing close to 15,000 Wannier90 calculations and as many Fermi surface calculations.
I set up a new AiiDA profile to access it and began asking the kinds of questions a materials scientist would actually ask.
The first round of queries went well.
The Analysis Agent listed processes correctly, diagnosed why calculations had failed, and searched for structures by chemical formula.
But then I asked a simple question: how many metallic structures are in this database?
The agent couldn't answer.

### The metadata gap

In the archive, critical information was registered as metadata attached to nodes, specifically in the node extras.
Whether a structure is metallic or insulating, its crystal symmetry, its bandgap, all of this lives in node extras, custom key-value fields.
The agent had no way to search by this metadata.

I first built a new tool called `query_nodes_by_extras` to fix it.
It let the agent filter nodes by any metadata field using AiiDA's QueryBuilder.
Testing against the archive, it returned exactly the right numbers: 5,597 metallic structures, 2,781 cubic structures, matching the ground truth from the researchers' own scripts.
But solving this one problem revealed a bigger issue.
If I added a new tool every time I discovered a missing query pattern, I would spend forever building special cases.

Rather than continuing to add special-case tools, I generalized the solution.
I built a generic `query_nodes` tool ([PR #28](https://github.com/aiidateam/aiida-agents/pull/28), currently under review) that accepts a structured specification with nested AND/OR filters, sorting, pagination, and group scoping.
This approach moved the complexity from tool-building into prompt-based spec generation: the model now composes query specifications instead of requiring custom code for each new pattern.

### Discovering workflows at runtime

That's when I started thinking about the Execution Agent, the system for helping researchers set up and run new simulations.
The initial plan was to have the model generate workflow specifications as JSON, validate those specs against AiiDA's schema, then execute them.
Then the mentor asked a question that made me reconsider.
What happens when someone installs a new AiiDA plugin tomorrow?
If the agent only knows about hardcoded workflows for Quantum ESPRESSO and VASP, it wouldn't recognize the new plugin.
The system would be obsolete as soon as it shipped.

I decided to rethink the architecture.
Instead of predefining which workflows exist, I would ask the system to discover them at runtime.
I built tools that dynamically inspect what AiiDA has installed and learn the requirements of any workflow on the fly.
The model no longer needs to know about Quantum ESPRESSO or VASP or SIESTA specifically.
It just asks: what workflows are available?
What do they need?
How do I build inputs for them?

This required rewriting a lot of code.
I deleted the hard-coded logic for specific codes and replaced it with generic recursion that handles nested input structures of any depth.
The submission system now correctly processes workflows with complex hierarchical inputs.
Rather than requiring the agent to figure out the entire nested tree of input parameters from scratch, I integrated it with the `get_builder_from_protocol` methods implemented on many workchains.

The flagship workchains maintained by the team, such as those in aiida-quantumespresso, provide these high-level interfaces.
They allow the agent to leverage existing protocols instead of reconstructing simulation parameters from scratch.
By the end of week eight, I had 360 passing tests while removing 2,400 lines of hard-coded logic, with clean linting and zero type errors.
The agent was genuinely plugin-agnostic.
Install a new AiiDA workflow plugin, and the system will discover it and help users run it without any changes to the code.

### Where things stand

The biggest lesson from these two weeks came from testing against real data.
Isolated testing never would have revealed that the agent couldn't filter by metadata.
Wrestling with actual AiiDA workflow complexity forced me to build abstractions that are far more robust than the initial design.

The work is visible in two pull requests under review: [the core execution framework](https://github.com/aiidateam/aiida-agents/pull/29) and [the plugin discovery system](https://github.com/aiidateam/aiida-agents/pull/31).
The architectural foundation is now solid enough for the next phase, once these PRs are merged.

---

## Weeks 9 & 10: Making the agent prove what it says

### The agent made up a number

I asked it what k-point spacing to use for a silicon relaxation, and it told me.
The number looked completely reasonable.
However, it had come from nowhere: no tool had returned it, and the documentation search had not been called.

A wrong number here is not a wrong sentence.
It configures a calculation that then runs for hours and produces something quietly incorrect.

My first fix was to add a line to the system prompt telling the agent never to state a value it had not retrieved.
I tested it five times and it ignored the instruction five times.

So the check moved out of the prompt and into code that runs after the answer is written ([#48](https://github.com/aiidateam/aiida-agents/pull/48)).
Every reply is now scanned for numbers carrying a unit, written as a percentage, or sitting in a sentence that names a simulation parameter.
Anything that appears in no tool output gets flagged in the terminal before the user reads the answer.
The detector is deliberately narrow, because a warning that fires on correct answers is one people learn to scroll past.

### One question, several specialists

Until this point you had to tell the tool which agent you wanted with `-a analysis` or `-a execution`.
That is a reasonable thing to ask of me and an unreasonable thing to ask of a researcher who has not read the architecture.

I added a router that picks the specialist per request ([#45](https://github.com/aiidateam/aiida-agents/pull/45)), then replaced it with a planner ([#50](https://github.com/aiidateam/aiida-agents/pull/50)) once it became clear that some questions need both.
"Why did this fail, and can you resubmit it with a longer wallclock limit" is two steps with a handoff in the middle.
The planner has no tools of its own, so the step that decides what to do cannot touch the database.

Passing a step's findings to the next one as prose lost the part that mattered.
A diagnosis says the failure is in a `PwCalculation` with a PK of 334407, and the next step needs that number, not a sentence containing it.
The handoff is now a typed message carrying the node references the first step's tools returned ([#58](https://github.com/aiidateam/aiida-agents/pull/58)), so a second model never has to read a pk back out of prose.

### Diagnosing a real failure

The data archive gave me failed Quantum ESPRESSO runs to work with, which is different from a test fixture in a way I had underestimated.

A `PwBaseWorkChain` that exits with 501 has not really told you anything.
The work chain is reporting that something below it failed, and the calculation that actually broke is somewhere further down.
The tool I built walks that chain and reads the exit code's meaning from the process class itself ([#53](https://github.com/aiidateam/aiida-agents/pull/53)).

The part I did not anticipate was the restart handlers.
AiiDA WorkChains record which recovery strategies they already attempted, and without reading that record an agent will happily recommend a fix the WorkChain already tried twice.
On pk 334599 it now reports that `handle_vcrelax_converged_except_final_scf` fired on iteration 1 and the run still failed, which is the sentence that tells you restarting is not the answer.

Reading the calculation's own SCF trace came out of the same work ([#55](https://github.com/aiidateam/aiida-agents/pull/55)).
A cycle that ran out of iterations and one that never settled look identical from the exit code and call for different responses.
My first version of the parser reported oscillation on a relaxation that was converging fine, because I had treated the restart between ionic steps as part of one electronic cycle.

### Writing and running code

Some questions do not fit any fixed tool.
Finding every structure in a group that contains a particular element and reporting its final energy is several filters and a projection, and the `QueryBuilder` expresses it in six lines.
Adding a tool for each combination does not converge.

So the agent now writes the Python ([#63](https://github.com/aiidateam/aiida-agents/pull/63)) and runs it before showing it to anyone ([#65](https://github.com/aiidateam/aiida-agents/pull/65)).
Code that raises comes back to the model as a traceback, and it fixes its own snippet rather than handing you one that does not work.

Executing model-written Python against a research database needed more thought than the rest of the fortnight combined.
The answer is that it runs against a second AiiDA profile pointing at the same database through a PostgreSQL role holding no write privilege ([#64](https://github.com/aiidateam/aiida-agents/pull/64)).
A write is refused by PostgreSQL rather than caught by a check I wrote.
While a scratch database would have been safer, it would have been useless, though, since it cannot answer any question worth asking.

There is a static guard on top of that, and I have been careful in the code and the decision record not to call it a sandbox.
Python cannot be contained in-process, and a guard that claimed otherwise would be believed.

### Where things stand

The two agents became three, joined by a planner that decides which of them a request needs.
Everything that writes to the database still stops and asks first, and that guarantee lives on the tool rather than in the prompt.

Twelve pull requests merged over the fortnight, and the architecture is written down in an overview, an extension guide and eleven decision records ([#51](https://github.com/aiidateam/aiida-agents/pull/51)).

While the unit suite covers the plumbing thoroughly, it cannot tell me whether the planner routes a real question sensibly or whether a generated query returns what a researcher expected.
In addition, tests that run the whole architecture for a real calculation from end to end are still missing.
That is what the next two weeks are for.

Updates to this post will be provided every two weeks as the build progresses.

---

_Jaweria Batool is a software developer and GSoC 2026 contributor working on the AiiDA natural language interface project under the NumFOCUS umbrella._
