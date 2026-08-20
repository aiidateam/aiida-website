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

## Weeks 9 & 10: making the agent prove what it says

### The agent made up a number

I asked the agent what k-point spacing to use for a silicon relaxation, and it told me.
The number looked completely reasonable.
However, it had come from nowhere: no tool had returned it, and the documentation search had not been called.

A wrong number here configures a calculation that then runs for hours and produces something quietly incorrect.

My first fix was to add a line to the system prompt telling the agent never to state a value it had not retrieved.
I tested it five times and it ignored the instruction five times.

So the check moved out of the prompt and into code that runs after the answer is written ([aiida-agents#48](https://github.com/aiidateam/aiida-agents/pull/48)).
Every reply is now scanned for numbers carrying a unit, written as a percentage, or sitting in a sentence that names a simulation parameter.
Anything that appears in no tool output is flagged in the terminal underneath the answer, before anyone acts on it.
The detector is deliberately narrow, because a warning that fires on correct answers is one people learn to scroll past.

### One question, several specialists

Until this point you had to tell the tool which agent you wanted with `-a analysis` or `-a execution`.
That is a reasonable thing to ask of me and an unreasonable thing to ask of a researcher who has not read the architecture.

I added a router that picks the specialist per request ([aiida-agents#45](https://github.com/aiidateam/aiida-agents/pull/45)), then replaced it with a planner ([aiida-agents#50](https://github.com/aiidateam/aiida-agents/pull/50)) once it became clear that some questions need both.
"Why did this fail, and can you resubmit it with a longer wallclock limit?" is two steps with a handoff in the middle.
The planner has no tools of its own, so the step that decides what to do cannot touch the database.

Passing a step's findings to the next one as prose lost the part that mattered.
A diagnosis says the failure is in a `PwCalculation` with a PK of 334407, and the next step needs that number, not a sentence containing it.
The handoff is now a typed message carrying the node references the first step's tools returned ([aiida-agents#58](https://github.com/aiidateam/aiida-agents/pull/58)), so a second model never has to read a PK back out of prose.

### Diagnosing a real failure

The data archive gave me failed Quantum ESPRESSO runs to work with, which is different from a test fixture in a way I had underestimated.

A `PwRelaxWorkChain` that exits with 401 has not really told you anything.
The work chain is reporting that the `PwBaseWorkChain` below it failed, and the calculation that actually broke is somewhere further down.
The tool I built walks that chain and reads the exit code's meaning from the process class itself ([aiida-agents#53](https://github.com/aiidateam/aiida-agents/pull/53)).

The part I did not anticipate was the restart handlers.
AiiDA WorkChains record which recovery strategies they already attempted, and without reading that record an agent will happily recommend a fix the WorkChain already tried twice.
On one failed relaxation from the archive it now reports that `handle_vcrelax_converged_except_final_scf` fired on the first iteration and the run still failed, which is the sentence that tells you restarting is not the answer.

Reading the calculation's own SCF trace came out of the same work ([aiida-agents#55](https://github.com/aiidateam/aiida-agents/pull/55)).
A cycle that ran out of iterations and one that never settled look identical from the exit code and call for different responses.
My first version of the parser reported oscillation on a relaxation that was converging fine, because I had treated the restart between ionic steps as part of one electronic cycle.

### Writing and running code

Some questions do not fit any fixed tool.
Finding every structure in a group that contains a particular element and reporting its final energy is several filters and a projection, and the `QueryBuilder` expresses it in six lines.
Adding a tool for each combination does not converge.

So the agent now writes the Python ([aiida-agents#63](https://github.com/aiidateam/aiida-agents/pull/63)) and runs it before showing it to anyone ([aiida-agents#65](https://github.com/aiidateam/aiida-agents/pull/65)).
Code that raises comes back to the model as a traceback, and it fixes its own snippet rather than handing you one that does not work.

Executing model-written Python against a research database needed more thought than the rest of these two weeks combined.
The answer is that it runs against a second AiiDA profile pointing at the same database through a PostgreSQL role holding no write privilege ([aiida-agents#64](https://github.com/aiidateam/aiida-agents/pull/64)).
A write is refused by PostgreSQL rather than caught by a check I wrote.
While a scratch database would have been safer, it would have been useless, since it cannot answer any question worth asking.

There is a static guard on top of that, and I have been careful not to present it as containment.
Python cannot be contained in-process, and a guard that claimed otherwise would be believed; what holds the line is the database role, which is why the decision record rejects a restricted interpreter outright.

### Where things stand

The two agents became three, joined by a planner that decides which of them a request needs.
Everything that writes to the database still stops and asks first, and that guarantee lives on the tool rather than in the prompt.

The architecture is now written down in an overview, an extension guide, and eleven decision records, three of them added over these two weeks ([aiida-agents#51](https://github.com/aiidateam/aiida-agents/pull/51)).

While the unit suite covers the plumbing thoroughly, it cannot tell me whether the planner routes a real question sensibly or whether a generated query returns what a researcher expected.
In addition, tests that run the whole architecture for a real calculation from end to end are still missing.
That is what the next two weeks are for.

---

## Weeks 11 & 12: hardening what exists

### A read-only role is not a sandbox

The codegen sandbox shipped in week 10 as a second profile pointing at the same database, through a PostgreSQL role with no write privilege.
The reasoning was that an empty scratch database, while safer, would be useless, as it cannot answer any questions about the real data.

Then mentor deleted the sandbox profile, agreed when `verdi` asked whether to delete its data, and lost his own database.

The read-only role was never the weak point.
The destructive command is run by the user, as themselves, against a profile they had been told was disposable, and no database privilege stands between a person and `verdi profile delete`.
What I had got wrong was upstream of the implementation: I framed the choice as shared-storage versus empty, and a copy is neither.

That's why now, the sandbox is a disposable copy of the user's profile storage, with one rule expressed as a single function that asks whether deleting one profile's data would destroy another's.
It fails closed, so a backend the code cannot reason about counts as sharing.
`init` refuses to register a sandbox that shares storage, `check` fails on one, `teardown` refuses to delete one, and `doctor` reports it, all through that one implementation ([aiida-agents#85](https://github.com/aiidateam/aiida-agents/pull/85), closing [#73](https://github.com/aiidateam/aiida-agents/issues/73)).

The layers above it are not containment and are documented as such.
The static guard is a pre-check, and dogfooding it found a one-line bypass that I closed in the same pull request.
The subprocess now gets a scrubbed environment rather than inheriting every API key I had exported, along with memory and file-size limits and its own process group.
What the copy does not protect is the filesystem or the network, and that is written down as a known gap rather than implied away.

### Three bugs my own tests had certified

The grounding check, which exists to catch numbers the model invented, was accepting any number that appeared anywhere in tool output.
Real tool dumps are full of incidental integers, so a fabricated "60 Ry" passed because some unrelated node happened to have pk 60.
The check now distinguishes a quantity asserted with a unit or a parameter name from a bare number that merely occurs somewhere ([aiida-agents#87](https://github.com/aiidateam/aiida-agents/pull/87)).

A batch resubmission promised in its docstring to be all-or-nothing and was not: a spec that failed validation halfway through left the earlier members already submitted.
It now validates every member before submitting any, and a failure during the run phase reports which pks did go out ([aiida-agents#86](https://github.com/aiidateam/aiida-agents/pull/86)).

The root options only worked before the subcommand, so `aiida-agents ask -a analysis "..."` failed while `aiida-agents -a analysis ask "..."` worked, for no reason a user could infer ([aiida-agents#88](https://github.com/aiidateam/aiida-agents/pull/88)).

For each of these I reverted the fix after writing the test and confirmed the test failed.
Two of them had tests written against real transcripts that still passed with the bug present, which is why the convention exists.

### Dependencies, and CI going red everywhere

Every open pull request went red at once, and none of them had caused it.
The package depended on an unpinned `aiida-core` git branch, which had moved to a 3.0 development version that conflicted with `aiida-pseudo`'s cap.
I pinned it ([aiida-agents#89](https://github.com/aiidateam/aiida-agents/pull/89)), and once `aiida-core` 2.9 was released, the project was moved onto the released version.

I nearly shipped a silent regression here.
An override I added dropped Sphinx and fifty other packages from the lock file, which I caught only because the pull request's diff summary said 883 deletions on what should have been a two-file change.

---

## Final report

_This is the closing report for the Google Summer of Code 2026 project described throughout this post._
_The sections above are the running log written fortnightly as the work happened; this one summarises what shipped, what did not, and what is left for whoever picks it up._

**Project:** a natural-language, multi-agent interface to [AiiDA](https://www.aiida.net/)
**Code:** [github.com/aiidateam/aiida-agents](https://github.com/aiidateam/aiida-agents)
**My contributions:** [58 pull requests](https://github.com/aiidateam/aiida-agents/pulls?q=is%3Apr+author%3AJaweria-B) · [the 51 that merged](https://github.com/aiidateam/aiida-agents/pulls?q=is%3Apr+author%3AJaweria-B+is%3Amerged) · [my commits on `main`](https://github.com/aiidateam/aiida-agents/commits/main?author=Jaweria-B)
**Mentor:** [Julian Geiger](https://github.com/GeigerJ2), [Edan Bainglass](https://github.com/edan-bainglass)

### The problem

AiiDA records every calculation a researcher runs and how each one connects to the others, which makes it possible to ask precise questions about a body of work.
Asking them means knowing which of several dozen `verdi` commands to reach for, and often chaining four or five together.
"Why did this calculation fail?" is a five-step investigation that assumes you already know the five steps exist.

This project is a natural-language interface that answers those questions and, with confirmation, acts on them.

### What was built

A planner reads the request and names which specialist handles it, in what order, up to three steps.
It holds no tools of its own, so the component that decides what to do cannot touch the database.

Three specialists do the work.
**Analysis** explores the provenance graph and reads the documentation, and has no write tool at all.
**Execution** discovers installed workflows, inspects their input schemas, builds inputs from a protocol builder, and submits, with every write behind an approval prompt.
**Codegen** writes Python for questions no fixed tool expresses, runs it, and reports what it returned.

Three guarantees hold underneath.
Nothing is written without confirmation, and the gate lives on the tool rather than in the prompt, so no phrasing talks it out of asking.
Nothing is quoted that no tool produced: every reply is scanned afterwards for quantities that appear in no tool output, because the prompt-level version of the same rule was ignored in five test runs out of five.
Generated code runs against a disposable copy of the user's AiiDA profile storage, never the researcher's own production data.

The same tool layer is served over MCP for any compatible client, with the write tools deliberately absent, because a generic client has no approval gate.
Plugins extend all of this through one entry point, contributing tools, documentation corpora, and prompt fragments without this package ever importing theirs.

### What got merged

**[51 of my 58 pull requests](https://github.com/aiidateam/aiida-agents/pulls?q=is%3Apr+author%3AJaweria-B+is%3Amerged)**, making up **56 of the 72 commits** on `main`.
The tree carries 1066 tests, runs strict typing across Python 3.10 to 3.14, and documents its design in eleven decision records.

By area:

- **Tool layer and MCP server** — the read-only surface over AiiDA's API, served both to the agents and to external MCP clients ([#2](https://github.com/aiidateam/aiida-agents/pull/2), [#18](https://github.com/aiidateam/aiida-agents/pull/18), [#28](https://github.com/aiidateam/aiida-agents/pull/28))
- **Analysis agent** — provenance queries, process reports, retrieved-file reading, and failure diagnosis that walks from a work chain's exit code down to the calculation that actually broke ([#4](https://github.com/aiidateam/aiida-agents/pull/4), [#35](https://github.com/aiidateam/aiida-agents/pull/35), [#43](https://github.com/aiidateam/aiida-agents/pull/43), [#53](https://github.com/aiidateam/aiida-agents/pull/53))
- **RAG over the AiiDA documentation** — local embeddings, fenced corpora, atomic indexing, and citations that link to the page the answer came from ([#5](https://github.com/aiidateam/aiida-agents/pull/5), [#23](https://github.com/aiidateam/aiida-agents/pull/23), [#34](https://github.com/aiidateam/aiida-agents/pull/34), [#61](https://github.com/aiidateam/aiida-agents/pull/61))
- **Execution agent and the approval gate** — workflow discovery, schema introspection, protocol and spec-driven input building, cutoff range checks, sequential runs, and batch resubmission under a single approval ([#8](https://github.com/aiidateam/aiida-agents/pull/8), [#29](https://github.com/aiidateam/aiida-agents/pull/29), [#36](https://github.com/aiidateam/aiida-agents/pull/36), [#52](https://github.com/aiidateam/aiida-agents/pull/52), [#54](https://github.com/aiidateam/aiida-agents/pull/54), [#56](https://github.com/aiidateam/aiida-agents/pull/56), [#57](https://github.com/aiidateam/aiida-agents/pull/57))
- **Grounding** — the structural check that catches invented quantities and unsourced API symbols ([#47](https://github.com/aiidateam/aiida-agents/pull/47), [#48](https://github.com/aiidateam/aiida-agents/pull/48), [#87](https://github.com/aiidateam/aiida-agents/pull/87))
- **Codegen agent and sandbox** — writing AiiDA code from retrieved examples and running it against a disposable copy ([#63](https://github.com/aiidateam/aiida-agents/pull/63), [#64](https://github.com/aiidateam/aiida-agents/pull/64), [#65](https://github.com/aiidateam/aiida-agents/pull/65), [#85](https://github.com/aiidateam/aiida-agents/pull/85))
- **Planner** — routing and multi-step plans across specialists ([#45](https://github.com/aiidateam/aiida-agents/pull/45), [#50](https://github.com/aiidateam/aiida-agents/pull/50))
- **Evaluation harness** — scoring answers against solved AiiDA Discourse threads, and asserting on what an agent did rather than what it said ([#40](https://github.com/aiidateam/aiida-agents/pull/40), [#62](https://github.com/aiidateam/aiida-agents/pull/62), [#66](https://github.com/aiidateam/aiida-agents/pull/66))
- **CLI** — subcommands, configuration reporting, history, multiline input, and a `doctor` that names the fix for each failure ([#15](https://github.com/aiidateam/aiida-agents/pull/15), [#19](https://github.com/aiidateam/aiida-agents/pull/19), [#88](https://github.com/aiidateam/aiida-agents/pull/88))
- **Architecture documentation** — the overview, the extension guide, and eleven decision records ([#42](https://github.com/aiidateam/aiida-agents/pull/42), [#51](https://github.com/aiidateam/aiida-agents/pull/51))

### What did not get merged

Seven pull requests closed without merging, and none were rejected on their merits.

Five were early iterations superseded by reworked versions that landed instead: the first MCP tools ([#2](https://github.com/aiidateam/aiida-agents/pull/2)), two passes at the generic query tool ([#25](https://github.com/aiidateam/aiida-agents/pull/25), [#26](https://github.com/aiidateam/aiida-agents/pull/26)), a standalone diagnostic agent ([#17](https://github.com/aiidateam/aiida-agents/pull/17)) that became a tool on the Analysis agent rather than a fourth specialist, and a first Execution agent ([#29](https://github.com/aiidateam/aiida-agents/pull/29)) rebuilt around the approval primitive.
One ([#92](https://github.com/aiidateam/aiida-agents/pull/92)) was overtaken by my mentor's equivalent change once `aiida-core` 2.9 was released.
One ([#70](https://github.com/aiidateam/aiida-agents/pull/70)) was folded into a later pull request.

One piece of finished work is not yet open as a pull request: folding `check` and `warm` into a single `doctor` command with `--only` and `--warm` flags ([#75](https://github.com/aiidateam/aiida-agents/issues/75)).
It waits on a related change of my mentor's that touches the same command.

### What is left to do

The gap I would close first is **an end-to-end test against a real DFT calculation**.
The unit suite covers the plumbing thoroughly, and cannot tell anyone whether a generated query returns what a researcher expected.

Beyond that, in the repository's open issues:

- **OS-level isolation for generated code** — the copy protects the database; the filesystem and network are narrowed but not closed
- **Onboarding** ([#83](https://github.com/aiidateam/aiida-agents/issues/83)) — a fresh profile needs a computer, a code, a plugin and pseudopotentials, and the agent correctly asks for all of them without being able to provide any
- **Serving RAG and plugin tools over MCP** ([#84](https://github.com/aiidateam/aiida-agents/issues/84)) — an MCP client currently gets ungrounded answers because the doc-search tool is not registered there
- **Moving the grounding vocabulary to a plugin hook** ([#80](https://github.com/aiidateam/aiida-agents/issues/80)) — units and parameter names are DFT-specific and should not live in a generic package
- **Restoring token streaming** ([#78](https://github.com/aiidateam/aiida-agents/issues/78)) — lost when the approval gate landed, and it has to compose with the deferred-tool output type
- **Consolidating the agent builders** ([#77](https://github.com/aiidateam/aiida-agents/issues/77)) — a mechanical refactor that would put two safety invariants in one place instead of three
- **Plugin tools reaching the Execution agent** — today a plugin can only contribute to Analysis

### Trying it, and building on it

```bash
pip install "aiida-agents[rag] @ git+https://github.com/aiidateam/aiida-agents.git"
aiida-agents doctor      # every subsystem, and the command that fixes each failure
aiida-agents rag build
aiida-agents chat
```

---

_Jaweria Batool is a software developer and GSoC 2026 contributor working on the AiiDA natural language interface project under the NumFOCUS umbrella._
