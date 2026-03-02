---
title: "ai-tax-cpa-agent"
slug: "ai-tax-cpa-agent"
emoji: "💰"
tier: "supporting"
tech: ["Python", "FastAPI", "Next.js", "Claude API"]
repo: "https://github.com/Cuuper22/ai-tax-cpa-agent"
oneLiner: "Tax engine that separates deterministic math from AI inference. The IRS doesn't accept vibes."
---

Tax engine that separates deterministic math from AI inference. because most "AI tax" demos are vibes. They run your income through a language model that confidently returns something close to correct. That's not how tax math works. Close enough is literally illegal. The IRS does not accept floating-point rounding errors.

The tax engine is pure Python with `Decimal` precision and real 2024 IRS brackets. all four filing statuses, progressive calculation through each bracket boundary, standard vs. itemized deduction comparison, TCJA corporate flat rate. No language model touches the arithmetic. When the IRS says the single filer 22% bracket starts at $47,150, that's a `Decimal("47150")` in the code, not a number the AI remembered from training data.

Claude handles the parts where deterministic code can't help: reading W-2 images, extracting structured data from 1099s, generating audit defense strategies with specific IRC section citations. 42 tests verify the tax engine independently of the AI. The math is the math. The judgment calls are where the model earns its keep.
