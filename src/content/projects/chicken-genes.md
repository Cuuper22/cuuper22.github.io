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
oneLiner: "Animal-breeding math pointed at AI fine-tuning, with five predictions written down in advance. Most of them failed."
updated: "2026-10-14"
---

This started as a joke. The Costco rotisserie chicken has cost $4.99 since 2009, so it might be the most optimized object on Earth, and maybe superintelligence should be modeled on it. Then I looked at what actually made that chicken: seventy years of breeding for growth, and a pile of side effects nobody selected for, like birds outgrowing their own hearts. Breeders built real math for that problem. The G-matrix measures how traits are wired together, and the breeder's equation uses it to predict the side effects of selection before you breed a generation.

Fine-tuning a language model has the same problem. Train a model on one narrow kind of bad advice and it can go bad across the board, which is called emergent misalignment. So I measured a G-matrix for Qwen2.5-0.5B on my laptop's 3060: 21 behaviors, hundreds of tiny weight perturbations as "siblings", and real LoRA fine-tunes as ground truth, including matched pairs like bad medical advice against good medical advice.

The first round looked promising: once you subtract what the harmless twin also does, the harmful part of fine-tuning seemed to lie along one of the model's easiest directions. That came out of exploring, so I wrote the analysis and five predictions into a preregistration, trained 16 new adapters on a rented A100, and had a separate model grade the open answers blind.

The predictions mostly failed. Every difference between two fine-tunes lies on easy directions, so misalignment isn't special there. The breeder's forecast couldn't tell which dataset would cause misalignment, and neither could a persona-vector baseline. The forced-choice test sheet only partly agreed with graded answers, partly because my recipe made small models collapse into talking about their training topic. And a "price lock" that projects locked traits out of each update made the locked traits move more, not less.

The write-up keeps all of it: the catches, the failed predictions, related work, and a lab notes window with every number.
