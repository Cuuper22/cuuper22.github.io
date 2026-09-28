---
title: "gpu_stack"
slug: "gpu-stack"
icon: "gpu"
file: "GPUSTACK.PY"
tier: "headline"
order: 4
tech: ["Python", "SymPy", "Systems modeling", "WebMCP"]
repo: "https://github.com/Cuuper22/gpu_stack-"
site: "https://cuuper22.github.io/gpu_stack-/"
oneLiner: "One equation graph for GPU training, from the cost of a token down to the speed of light."
updated: "2026-09-03"
demo: "gpu"
---

gpu_stack started in the overlap between my AI work and my physics brain. The question was simple enough to be annoying: when people say frontier training is just "more GPUs, more data, more money," where does that sentence actually bottom out? Not rhetorically. Physically.

A token passes through model architecture, kernels, collectives, memory bandwidth, transistor switching, lithography, materials, thermals, power delivery, and eventually a cost line someone has to pay. The stack usually gets explained in slices. I wanted the uncomfortable version where the slices have to talk to each other.

So gpu_stack is a SymPy-backed symbolic model of the whole thing. Every variable carries units, a description, symbolic assumptions, and back-references for traversal. The path in the panel above is real: walk it from `physics.speed_of_light` and you pass through link time-of-flight, scale-out latency, exposed data-parallel communication, step time, and wallclock before you land on `econ.cost.per_token`. The exported cone on the live site alone is 700 nodes and 999 edges.

The point is not to hide the unknowns. Anything the model can't derive is a named root input, ranked by how much of the graph depends on it. Root inputs are not a shame pile. They're visible modeling debt, which is much better than hidden modeling debt wearing a lab coat. The heaviest debt right now sits in lithography and MOSFET physics, which is about where you'd expect.

Lately it has grown into a small virtual-datacenter lab with preregistered experiments, and it reports its own failures. One experiment threw out all 32 of its runs because the power meter sampled 25 times slower than requested. In another, the adaptive controller abstained 104 times outside its calibrated range and lost to the plain baseline. Both are written up as results. The live Causal Observatory exposes eight WebMCP tools, so an agent can trace a causal path the same way you just did.
