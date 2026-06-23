---
title: "Teaching AiiDA to Speak Human: GSoC 2026 Journey Begins"
date: 2026-05-26
author: Jaweria Batool
category: Blog
tags: [gsoc, aiida, ai, gsoc2026]
---

## Community bonding: what I have been up to

The project is a **natural language interface for AiiDA** built on a multi-agent AI architecture.
Various specialized agents handle different parts of the interaction, among others: an Orchestrator that routes the user's intent, a Workflow Agent that submits jobs, a Config Agent that builds simulation parameters, a Diagnostic Agent that interprets calculation failures, and an Analysis Agent that queries results from AiiDA's provenance graph.

The agents connect to AiiDA through an MCP (Model Context Protocol) server that exposes AiiDA's Python API as typed, validated tools.
This means the AI never directly calls AiiDA or writes arbitrary Python code.
Instead, every action goes through a defined interface with input validation.
That matters because wrong parameters on a supercomputer job waste compute time, and catching errors before submission is much cheaper than catching them after.

Before anything gets submitted to an HPC cluster, the scientist sees the generated parameters and confirms.
This is because AI can produce inputs that look correct but are physically nonsensical, thus, a human confirmation step is a necessary safeguard here.

## Weeks 1 & 2: setting up the MCP tools and the first agent

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

## Weeks 3 & 4: setting up the MCP tools and the first agent

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

Updates to this post will be provided every two weeks as the build progresses.

---

_Jaweria Batool is a software developer and GSoC 2026 contributor working on the AiiDA natural language interface project under the NumFOCUS umbrella._
