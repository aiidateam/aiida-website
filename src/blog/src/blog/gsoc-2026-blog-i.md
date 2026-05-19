---
title: "Teaching AiiDA to Speak Human: GSoC 2026 Journey Begins"
date: 2026-05-19
author: Jaweria Batool
category: Blog
tags: [gsoc, aiida, ai, gsoc2026]
---

## What I Am Building

The project is a **natural language interface for AiiDA** built on a multi-agent AI architecture.

Various specialized agents handle different parts of the interaction, among others: an Orchestrator that routes the user's intent, a Workflow Agent that submits jobs, a Config Agent that builds simulation parameters, a Diagnostic Agent that interprets calculation failures, and an Analysis Agent that queries results from AiiDA's provenance graph.

The agents connect to AiiDA through an MCP (Model Context Protocol) server that exposes AiiDA's Python API as typed, validated tools.

This means the AI never directly calls AiiDA or writes free-form custom Python code.

Instead, every action goes through a defined interface with input validation.

That matters because wrong parameters on a supercomputer job waste real compute time, and catching errors before submission is much cheaper than catching them after.

Before anything gets submitted to an HPC cluster, the scientist sees the generated parameters and confirms.

This is because AI can produce inputs that look correct but are physically nonsensical, thus, a human confirmation step is a necessary safeguard here.

## Community Bonding, What I Have Been Up To

Coding starts May 25, but I have been working through the AiiDA codebase since the community bonding period opened.

The first week was spent entirely on AiiDA fundamentals, installing it on WSL (Windows Subsystem for Linux), running the basic tutorial, and working through concepts I had no prior exposure to: provenance graphs, WorkChains, CalcJobs, QueryBuilder.

The mental model is different from what I was used to.

In my previous agentic projects I controlled the data flow explicitly.

In AiiDA, the framework manages it, and you work within its structure.

The provenance graph was the concept that clicked most clearly.

Every input, output, and calculation is stored permanently and linked together, to produce a complete record of how every result was obtained.

When I ran `verdi node graph generate` and saw the WorkChain laid out visually, inputs flowing in, processes running, outputs coming back, it gave me a much more concrete picture of what the Analysis Agent will be querying.

I also went through `PwBaseWorkChain` and `pw.relax`, some of the target Quantum ESPRESSO workflows of the project.

On the communication side: I joined the AiiDA Slack workspace, attended the biweekly team meeting, and met with the mentors and development team.

The team is small and technically sharp.

Julian will be guiding the AiiDA domain side; I bring the AI systems knowledge.

That division makes sense given what the project needs.

## What Comes Next

The next phase of the project will focus on building the MCP integration layer and establishing reliable communication between the agents and AiiDA workflows.

The principle I am going in with: get one thing working end-to-end before adding more.

One agent reliably talking to AiiDA through MCP is worth more at this stage than multiple agents partially working.

Build the foundation, then expand.

The harder part will be the Quantum ESPRESSO domain knowledge, valid parameter ranges, which inputs matter for which calculation types, and what the outputs actually mean.

That is where the team's expertise becomes essential.

The project is genuinely collaborative, which is what makes it interesting.

Updates to this post will be provided every two weeks as the build progresses.

---

_Jaweria Batool is a software developer and GSoC 2026 contributor working on the AiiDA natural language interface project under the NumFOCUS umbrella._
