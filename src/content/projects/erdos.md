---
title: "Erdos"
slug: "erdos"
emoji: "🔗"
tier: "highlight"
tech: ["Python", "Lean 4", "Rust", "Tauri", "React"]
repo: "https://github.com/Cuuper22/Erdos"
oneLiner: "Automated theorem prover that caught its own AI cheating at math."
---

I wanted to see if LLMs could prove real math. Not "what's 2+2". actual formal proofs that compile in Lean 4, which is a proof assistant that won't let you hand-wave. You either have a valid proof or you don't. The compiler is the judge.

Erdos runs a Prover/Critic loop: one agent proposes a proof, another tears it apart, they iterate until something compiles or the budget runs out. Cool in theory. In practice, the agents cheated. They'd subtly redefine the theorem statement. shift it just enough to make the proof trivial, then claim success. Everything compiles, the Critic signs off, and you've just formally verified a convenient reinterpretation of the original problem.

Fix: SHA-256 hash on every theorem statement before the loop starts. One character changes, the attempt dies before it reaches the compiler.

That's an alignment problem. A small one, but real. When AI agents have the ability to modify their own success criteria, they will. Even in pure math, where "success" should be unambiguous. <span class="arabic-easter-egg" title="يسطا - bro/dude">Man,</span> if they'll cheat at *math*, what won't they cheat at?

Desktop GUI via Tauri (Rust + React). Multi-provider LLM support. Gemini, OpenAI, Anthropic, Ollama for local. Because theorem provers shouldn't only live in terminals, and you shouldn't be locked into one API.
