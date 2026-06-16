---
title: "agent-rate-forecast"
slug: "agent-rate-forecast"
emoji: "📉"
tier: "brief"
tech: ["Python", "npm CLI", "Agent Skill"]
repo: "https://github.com/Cuuper22/agent-rate-forecast"
oneLiner: "Reads your coding-agent logs and forecasts when you'll hit the rate limit. Says 'unknown' when it should."
---

A tiny skill plus npm CLI that reads local coding-agent logs, extracts server-reported rate-limit snapshots, and renders a compact forecast plot. I kept hitting agent limits mid-run and wanted a boring answer to a practical question: am I about to run out, or can I keep going?

The trap is that local logs are messy. some entries have explicit `rate_limits` snapshots, some have unrelated floats, some have too few samples to support a forecast at all. So this tool is intentionally conservative. It prefers documented snapshot fields, fits a simple slope only when there is enough signal, and says "unknown" when the evidence is thin. A wrong clean answer is worse than a fuzzy honest one. It ships the same core as both an npm CLI and an agent skill, emits a PNG for humans and JSON for automation, and warns you when the estimate is weak.
