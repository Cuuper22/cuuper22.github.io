---
title: "CurbRun"
slug: "curbrun"
icon: "parking"
file: "CURBRUN.APK"
tier: "headline"
order: 6
tech: ["Kotlin", "Jetpack Compose", "SQLite", "OpenStreetMap", "SFMTA data"]
repo: "https://github.com/Cuuper22/curbrun"
oneLiner: "Finds curb in San Francisco you can legally park on, free, for the next N hours. Closest first."
updated: "2026-06-10"
demo: "curbrun"
---

CurbRun is a native Android app for one question: where can I park for free, legally, for the next N hours, as close as possible to here? It's a fast navigation surface, not a civic-data browser. Duration, vehicle size, candidate curbs, the reason each one is legal, and the hand-off to Google Maps all live on one screen.

The interesting part is the legality engine. It evaluates the entire `[now, now + N hours]` window against every rule on a curb segment: street cleaning, time limits, residential permit zones, color curbs, loading zones, meters, and whether the curb is even long enough for your car. Windows that wrap past midnight are walked day by day. A single overlap blocks the curb, with the reason attached: "Street cleaning overlaps your requested 2 hr window."

Legal curbs are ranked by distance plus an availability penalty, and each one carries its next restriction, so the app says "Free until Tue 8:00 AM" instead of merely proving your window fits. A live curb clock turns amber inside three hours and red inside one, and it holds the curb you picked as long as that curb stays legal.

Everything runs offline from a bundled SQLite database built by a reproducible pipeline (`scripts/build_curb_db.py`) from SFMTA's Digital Curb data: 2,668 curb segments and 21,268 rules, 8,002 of them street cleaning. And it's honest about uncertainty. Every result is labeled "Strong match," "Check signs," or "High competition," because the one thing worse than no parking app is one that confidently sends you to a tow zone.
