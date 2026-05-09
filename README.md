# cuuper22.github.io

Cuper's portfolio site, built as a small retro desktop instead of a flat list of cards.

The point of the site is not just to show finished projects. Each project page explains what pulled me into the problem, what I built, what I learned, and what a reviewer should inspect in the repo. The design is intentionally personal: window chrome, project folders, terminal jokes, and enough friction removed that a hiring person can still scan quickly.

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

- Start at `src/content/projects/`. The project Markdown files carry most of the narrative weight.
- `src/pages/index.astro` is the desktop shell and window system.
- `src/layouts/ProjectPage.astro` is the repeated project detail view.
- `public/screenshots/toaruos/` contains the OS screenshots used by the strongest systems project page.
