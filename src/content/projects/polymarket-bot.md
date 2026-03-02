---
title: "polymarket_bot"
slug: "polymarket-bot"
emoji: "📊"
tier: "supporting"
tech: ["Python", "NumPy", "Monte Carlo methods"]
repo: "https://github.com/Cuuper22/polymarket_bot"
oneLiner: "Prediction market trading bot with regime detection and Kelly criterion sizing."
---

Prediction market trading bot. I wanted to understand decision-making when being wrong costs you something immediately. not in the abstract, but in a domain where the market is full of other people trying to exploit the same signals you are. If your model is miscalibrated, you find out fast.

16,000 lines of Python. Bayesian regime detection classifies markets as trending, news-driven, volatile, or trap. The "trap" classification is the most important one: when price movement and sentiment contradict each other, the correct action is to do nothing. Knowing when NOT to act turns out to be the hardest part of any autonomous decision system.

Position sizing uses the Kelly criterion. mathematically optimal bet size given your estimated edge and the odds. Capped at 35% with a $15 max per position because Kelly is only optimal if your edge estimate is correct, and it never is. Monte Carlo validation: 1,000 independent sims with realistic cost modeling. 2% profit fees, 0.8% spread, 0.3% slippage.

The backtesting shows strong returns. on simulation data. Emphasis on *simulation*. It has executed zero live trades. I'm not going to pretend backtested returns mean anything in production. Most people in this space won't tell you that part. I will.
