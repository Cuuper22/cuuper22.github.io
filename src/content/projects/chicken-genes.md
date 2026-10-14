---
title: "Chicken Genes for AI"
slug: "chicken-genes"
icon: "sigma"
file: "CHICKEN.EGG"
tier: "supporting"
order: 5
tech: ["Python", "PyTorch", "LoRA", "Quantitative genetics"]
repo: "https://github.com/Cuuper22/chicken-genes"
site: "https://cuuper22.github.io/chicken-genes/"
oneLiner: "Animal-breeding math pointed at AI fine-tuning: misalignment is an easy road, but the math can't see it coming."
updated: "2026-10-13"
---

This started as a joke. The Costco rotisserie chicken has cost $4.99 since 2009, so it might be the most optimized object on Earth, and maybe superintelligence should be modeled on it. Then I looked at what actually made that chicken: seventy years of breeding for growth, and a pile of side effects nobody selected for, like birds outgrowing their own hearts. Breeders built real math for that problem. The G-matrix measures how traits are wired together, and the breeder's equation uses it to predict the side effects of selection before you breed a generation.

Fine-tuning a language model has the same problem. Train a model on one narrow kind of bad advice and it can go bad across the board, which is called emergent misalignment. So I measured a G-matrix for Qwen2.5-0.5B on my laptop's 3060: 21 behaviors, hundreds of tiny weight perturbations as "siblings", and real LoRA fine-tunes as ground truth, including matched pairs like bad medical advice against good medical advice.

Two results. Once you subtract what the harmless twin also does, the harmful part of fine-tuning lies along one of the easiest directions in the model's random wiring, around the 98th percentile against random directions, and it survived every control I threw at it. But the breeder's prediction, which was the actual dream, failed: it could not tell which dataset would cause misalignment before training. Most of what looked like misalignment at first was the fixed cost of fine-tuning a small model on anything at all.

The write-up keeps the catches in: a wording confound, a memory overflow, a dead process, and a scaling bug that briefly inflated one result. The interactive page has the figures and a lab notes window with every number.
