---
title: "Manim Director"
slug: "manim-director"
icon: "clapper"
file: "MANIMDIR.EXE"
tier: "supporting"
order: 2
tech: ["Rust", "MCP", "Python", "React", "Manim"]
repo: "https://github.com/Cuuper22/Manim-plugin"
oneLiner: "A coding-agent toolchain for math animation: Rust control plane, Manim runtime, and a real workbench."
updated: "2026-09-09"
---

Manim is the animation engine behind a lot of the best math videos on the internet. It's also a Python library where every render dumps logs, source, and video that would eat a coding agent's context whole. Manim Director is a plugin and local toolchain that lets an agent create, edit, render, debug, and ship Manim animations without drowning.

The shape is a fast Rust control plane (an MCP server, a job scheduler, a content-addressed cache, SQLite state), a thin Manim-native Python runtime, and an embedded React workbench with a timeline, inspector, render queue, and revision-safe code editor. The agent gets ten coarse tools with bounded responses, paged logs, and resource URIs. Media never travels as base64. Large things stay on disk and the model gets a pointer.

Projects live in a versioned `director.yaml`: scenes, storyboards, narration, themes, assets, render profiles, variants, deliverables. Edits are atomic with revision checks and undo snapshots, and they invalidate only the cache entries they touch. It ingests Markdown, LaTeX, Typst, notebooks, PDFs, and media as source material, then runs visual, mathematical, and caption QA before exporting to MP4, WebM, GIF, or a reproducible project bundle. Two releases are out, with checksummed static binaries.
