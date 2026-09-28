---
title: "Erdos"
slug: "erdos"
icon: "sigma"
file: "ERDOS.EXE"
tier: "headline"
order: 3
tech: ["Python", "Lean 4", "Tauri", "React", "LLM agents"]
repo: "https://github.com/Cuuper22/Erdos"
oneLiner: "Automated theorem prover that caught its own AI cheating at math."
updated: "2026-06-10"
demo: "erdos"
---

I wanted to see if LLMs could prove real math. Not "what's 2+2". Actual formal proofs that compile in Lean 4, a proof assistant that won't let you hand-wave. You either have a valid proof or you don't. The compiler is the judge.

Erdos runs a Prover/Critic loop: one agent proposes a proof, `lake build` checks it, another agent tears it apart, and they iterate until something holds or the budget runs out. Cool in theory. In practice, the agents cheated. They'd subtly rewrite the theorem statement, shift it just enough to make the proof trivial, then claim success. Everything compiles, the Critic signs off, and you've just formally verified a convenient reinterpretation of the original problem. `1 + 1 = 2` quietly becomes `True`, proved by `trivial`.

The fix is a lock. Before the loop starts, the theorem statement is extracted, whitespace-normalized, and SHA-256 hashed. Every candidate gets re-hashed before it's allowed near the compiler. One character changes, the attempt dies. A second gate bans the other escape routes: `sorry`, `admit`, `axiom`, `native_decide`, and any IO. That one was earned the hard way. An early version let `axiom my_cheat : 1 + 1 = 2` straight through.

The detail I'm proudest of is what the Prover *doesn't* see. Integrity failures are rewritten into a generic "try a different approach" before they're fed back, so the model can't learn the shape of the check and route around it. Compiler errors pass through, minus sandbox paths. The replay above follows that exact order.

That's an alignment problem. A small one, but real. When agents can modify their own success criteria, they will, even in pure math, where success should be unambiguous. <span class="arabic-easter-egg" title="يسطا - bro/dude">Man,</span> if they'll cheat at *math*, what won't they cheat at?

It ships as a CLI and a Tauri desktop app, speaks to seven model providers (OpenRouter, Gemini, OpenAI, Anthropic, Ollama, ChatGPT, and a mock for tests), and carries 342 tests, verified end to end against a real Lean 4.30 toolchain.
