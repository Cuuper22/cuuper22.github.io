---
title: "anti-slop-design"
slug: "anti-slop-design"
emoji: "🎨"
tier: "highlight"
tech: ["TypeScript", "CSS", "Design Systems"]
repo: "https://github.com/Cuuper22/anti-slop-design"
oneLiner: "Design system that kills generic AI aesthetics. 67 files, 8 domains, 178 checks."
---

Every AI coding tool generates the same website. Inter font. Purple gradient. Centered hero. Three feature cards with icons. A "Get Started" button that goes nowhere. Rounded corners on everything. It's the same site every time and it looks like it was designed by a committee that hates you.

This isn't a creativity problem. it's a distributional convergence problem. The model predicts the most likely next token. The most likely design is the average of everything it trained on. The average of a million websites is a very boring website. Telling it "be more creative" is a prompt engineering cope. The model doesn't have taste. It has probability distributions.

anti-slop-design is a Claude Code skill. 67 files across 8 domains (fintech, healthcare, government, editorial, devtools, consumer, enterprise, creative). that replaces the defaults with domain-aware design tokens before generation starts. A government site shouldn't look like a SaaS landing page. A healthcare app shouldn't have a hero gradient. 178 validation checks to make sure the output doesn't revert to slop.

It's the system that built the 20 versions of this site. Meta? Yeah. But someone had to do it. <span class="arabic-easter-egg" title="بضان - tedious/cringe">Cringe</span> levels were critical.
