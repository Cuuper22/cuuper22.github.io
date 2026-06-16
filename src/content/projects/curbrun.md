---
title: "CurbRun"
slug: "curbrun"
emoji: "🅿️"
tier: "supporting"
tech: ["Kotlin", "Jetpack Compose", "OpenStreetMap", "SQLite"]
repo: "https://github.com/Cuuper22/curbrun"
oneLiner: "Native Android app for finding free legal curb parking in SF. Closest-first, legality-aware."
---

CurbRun is a native Android app for finding legal free curb parking in San Francisco for a requested N-hour window. It ranks streets closest-first by legal fit, then by availability risk. The whole thing is designed as a fast navigation surface, not a civic-data browser. duration, vehicle profile, candidate streets, legality reasons, and the handoff to Google Maps all live on one screen.

The interesting part is the legality engine. it evaluates the entire `[now, now + N hours]` window against street cleaning, time limits, residential permit zones, color curbs, loading rules, meters, and curb length, then filters to free-only. Each candidate carries the next known restriction time, so the UI shows "free until 4pm" instead of just proving your window technically fits. A live reranking loop keeps that curb clock current as time moves and holds the selected curb as long as it stays legal.

Kotlin and Jetpack Compose, a real native OpenStreetMap surface, and a reproducible data pipeline in `scripts/build_curb_db.py` that bundles SFMTA Digital Curb data as SQLite inside the APK. It is honest about uncertainty too: results get labeled strong, sign-check-required, or high-competition, because the one thing worse than no parking app is one that confidently sends you to a tow zone.
