---
title: "gpu_stack"
slug: "gpu-stack"
emoji: "🧮"
tier: "highlight"
tech: ["Python", "SymPy", "Symbolic Modeling", "Physics"]
repo: "https://github.com/Cuuper22/gpu_stack-"
site: "https://cuuper22.github.io/gpu_stack-/"
oneLiner: "The entire GPU training stack as one equation graph. From cost-per-token down to quark counts."
---

gpu_stack started in the overlap between my AI work and my physics brain. The question was simple enough to be annoying: when people say frontier training is just "more GPUs, more data, more money," where does that sentence actually bottom out? Not rhetorically. Physically.

A token passes through model architecture, kernels, collectives, memory bandwidth, transistor switching, lithography, materials, thermals, power delivery, and eventually a cost line that someone has to pay. The stack usually gets explained in slices. I wanted the uncomfortable version where the slices have to talk to each other.

So gpu_stack is a SymPy-backed symbolic model of the whole training stack. Not a polished numerical simulator. a graph of equations, constraints, approximations, and exposed missing assumptions. Every scope self-registers on import. Variables carry units, descriptions, symbolic assumptions, and back-references for graph traversal. At the wide end are the questions people actually ask: what sets `econ.cost.per_token`, why did `training.tokens_per_second` move, how much site power disappears into cooling. At the narrow end are the things it refuses to pretend away. process geometry, source-plasma behavior, proton and neutron counts, valence quark roots, universal constants.

The point is not to hide the unknowns. Root inputs are not a shame pile. they are visible modeling debt, which is much better than hidden modeling debt wearing a lab coat. If that sounds like a weird amount of effort to understand GPU training, yes. That is more or less how the project happened.
