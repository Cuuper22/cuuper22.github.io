---
title: "jobhunter"
slug: "jobhunter"
emoji: "🤖"
tier: "supporting"
tech: ["Python", "FastAPI", "GCP", "Playwright", "Claude API"]
repo: "https://github.com/Cuuper22/jobhunter"
oneLiner: "AI job application system that scrapes, scores, drafts, but won't submit without human approval."
---

I needed a job. I also needed to not manually apply to 200 listings a week. So I built a system where AI agents scrape job boards, score each opportunity against my actual background, generate cover letters, and pre-fill application forms. Cloud Scheduler triggers it every 3 hours on Cloud Run. It's found 1,976 jobs, scored 247, and drafted 52 applications.

It has submitted zero.

Not because it's broken. the `/apply` endpoint exists, the Playwright form filler works, the ATS detection handles Greenhouse, Lever, and Workday. The system *can* submit. It doesn't, because the architecture requires a human to review every application and click "Approve" before anything goes out.

The harder constraint is honesty. The system prompts contain explicit rules: "The candidate does NOT have a completed degree. Do NOT say 'Bachelor's degree.'" Three separate AI modules. scorer, cover letter, form QA. each have their own truthfulness constraints baked into the system prompts. The LLM really wants to embellish. Getting one to say "I have 76 credits, no degree" instead of "I pursued an interdisciplinary education spanning multiple continents" was a whole thing.

Half the scored jobs cluster at exactly 50 on the 0-100 scale. The scoring threshold is 40. The model hedges, and I have to decide. That's a small-scale alignment problem: autonomous agent optimizing for an objective while constrained by values, with a human in the loop who has final say.

It also found me some good leads. Skill issue for not deploying it sooner.
