---
title: "agent-rate-forecast"
slug: "agent-rate-forecast"
icon: "gauge"
file: "RATEFCST.PY"
tier: "brief"
order: 3
tech: ["Python", "npm CLI", "Agent skill"]
repo: "https://github.com/Cuuper22/agent-rate-forecast"
oneLiner: "Reads your coding-agent logs and forecasts when you'll hit the rate limit. Says 'unknown' when it should."
updated: "2026-05-09"
---

A small skill plus npm CLI that reads local coding-agent logs, extracts server-reported rate-limit snapshots, and renders a compact forecast plot. I kept hitting agent limits mid-run and wanted a boring answer to a practical question: am I about to run out, or can I keep going?

The trap is that local logs are messy. Some entries have explicit `rate_limits` snapshots, some have unrelated floats, some have too few samples to support a forecast at all. So the tool is deliberately conservative. It prefers documented snapshot fields, fits a slope only when there's enough signal, and says "unknown" when the evidence is thin. A wrong clean answer is worse than a fuzzy honest one. The same core ships as an npm CLI and an agent skill, emits a PNG for humans and JSON for automation, and warns you when the estimate is weak.
