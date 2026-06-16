---
title: "codex-canmore"
slug: "codex-canmore"
emoji: "🪟"
tier: "supporting"
tech: ["Rust", "MCP", "Stdio"]
repo: "https://github.com/Cuuper22/codex-canmore"
oneLiner: "Gives a coding agent a medium layer. Disposable visual surfaces it can read back as events."
---

codex-canmore gives a coding agent a medium layer. Not a second canvas, not a file-preview clone. It lets the agent turn a thought into the right temporary surface. a decision board, a system diagram, a small control panel, a comparison grid, whatever makes the next move clearer. The surface can stay disposable. if it turns out to be useful project material, you promote it.

Under the hood it is a Rust stdio MCP server with local JSON storage. It stores each surface (title, purpose, medium type, cards, promotion state) and the structured feedback events that happen on it. clicks, selections, slider changes, notes. The point of that last part: the agent reads events, not a pile of prose. A tiny local Rust HTTP server serves each surface so a human can actually touch the medium and the agent can read back what they did.

It also stays disciplined about context. tool responses are compact unless the caller asks for the full spec or event log, so the medium layer does not quietly eat the model's attention budget. And the boundary is explicit: generated images come from the host's built-in `image_gen`, so the plugin never calls an image API or asks for keys. It is a small idea taken seriously. agents think better when they can sketch.
