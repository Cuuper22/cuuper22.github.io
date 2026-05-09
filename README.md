# cuuper22.github.io

Cuper's portfolio site, built as a small retro desktop instead of another flat list of project cards.

The point of the site is not just to show finished projects. Each project page explains what pulled me into the problem, what I built, what the work revealed, and what a reviewer should inspect in the repo.

The design is intentionally personal: window chrome, project folders, terminal jokes, Arabic hover notes, and enough friction removed that a hiring reviewer can still scan quickly. It is meant to feel like a builder's workbench, not a polished brochure pretending the messy parts never existed.

Live: [cuuper22.github.io](https://cuuper22.github.io)

## Stack

- Astro 5 static site
- Markdown content collection in `src/content/projects`
- Custom retro OS layout in `src/layouts`
- Generated Open Graph images in `src/pages/og`

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## How to Inspect

- Start at `src/content/projects/`. The Markdown files carry the project narratives and the reviewer-facing "what to inspect" notes.
- Read `src/pages/index.astro` for the desktop shell, project launcher, command palette, and easter eggs.
- Read `src/layouts/ProjectPage.astro` for the repeated project detail view.
- Check `public/screenshots/toaruos/` for the OS screenshots used by the strongest systems project page.

## Presentation Notes

This repo is part portfolio and part interface argument. The UI is a filter: it should make technical reviewers curious enough to open the deeper systems projects, while still giving recruiters a fast scan path through the work.
