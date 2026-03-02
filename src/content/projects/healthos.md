---
title: "HealthOS"
slug: "healthos"
emoji: "🏥"
tier: "brief"
tech: ["Python", "FastAPI", "React", "SQLite"]
repo: "https://github.com/Cuuper22/HealthOS"
oneLiner: "Personal health platform with a plugin architecture and anti-enumeration auth."
---

Personal health platform with a plugin architecture. the part I actually care about. Medical records, labs, and medications run as independent modules sharing a common `BaseModule` interface with 12+ abstract methods per plugin. A `ModuleRegistry` syncs with the database at startup. Cross-module query infrastructure exists but isn't wired up to individual modules yet. it is what it is.

Anti-enumeration auth: "If the email exists, a password reset link has been sent". regardless of whether the email exists. Rate limiting. JWT + bcrypt. My health data shouldn't require six patient portals to understand.
