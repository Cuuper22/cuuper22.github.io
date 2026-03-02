# Portfolio Site Rebuild Plan

## Architecture
- **Framework:** Astro (static site, islands architecture)
- **Design:** Retro OS desktop metaphor (Windows 95 style)
- **Content:** All from `portfolio-content-v2.md` (verbatim)
- **Template base:** `retro-os-template.html` (CSS variables, window system, fonts)
- **Deploy:** GitHub Pages (static HTML output)

## Skills to Load After Compaction
1. `/anti-slop-design` - design system checks
2. Read `portfolio-content-v2.md` - content source
3. Read `PROMPT-build-portfolio.md` - full spec

## Steps

### Phase 1: Project Setup
- [x] Create PreCompact hook in `.claude/settings.json`
- [x] Create PLAN.md (this file)
- [x] Initialize Astro project
- [x] Install dependencies (astro)
- [x] Set up project structure per spec

### Phase 2: Core Layout & Styles
- [x] Create `global.css` with OKLCH palette from template, fonts, OS chrome styles
- [x] Create `Desktop.astro` layout (taskbar, background, window manager shell)
- [x] Create `ProjectPage.astro` layout (maximized window with desktop bg)
- [x] Window/DesktopIcon/Taskbar integrated into Desktop.astro (simpler than components)

### Phase 3: Content Collections
- [x] Set up Astro content collections for projects (glob loader)
- [x] Create all 11 project markdown files with frontmatter + verbatim content
  - [x] toaruos-arnold.md, erdos.md, anti-slop-design.md (highlights)
  - [x] polymarket-bot.md, jobhunter.md, ai-tax-cpa-agent.md, bennycutools.md (supporting)
  - [x] healthos.md, bee.md, saas-starter-kit.md, claude-sfx.md (brief)

### Phase 4: Homepage (Desktop)
- [x] Create `index.astro` - the OS desktop
- [x] Desktop icons: About.txt, Projects, Arc.txt, Contact
- [x] About.txt window (auto-opens) - full opener + background from content doc
- [x] Projects window - tiered grid (highlights/supporting/brief)
- [x] Arc.txt window - The Arc section
- [x] Contact window - email, GitHub, LinkedIn
- [x] Arabic easter egg spans with hover tooltips
- [x] Window management JS (z-index, open/close, drag on desktop)
- [x] Mobile adaptation (horizontal icons, stacked windows)

### Phase 5: Project Pages
- [x] Create `[slug].astro` dynamic route
- [x] Window-style layout with title bar, close (back to /)
- [x] Full verbatim content from markdown
- [x] Tech stack pills, GitHub link
- [x] View Transitions API for window maximize/minimize effect

### Phase 6: Easter Eggs
- [x] Command Palette (Cmd+K / Ctrl+K) - search all projects, sections
- [x] Screensaver (idle 2min) - "I'LL BE BACK" DVD bounce
- [x] BSOD 404 page
- [x] Konami Code - Terminal.exe with commands (help, whoami, ls, cat, sudo rm, exit)

### Phase 7: OG Social Cards
- [x] Per-project OG image generation at build time (satori + @resvg/resvg-js)
- [x] Homepage OG card
- [x] Meta tags in all page heads

### Phase 8: Polish & Deploy
- [x] Anti-slop checklist validation (retro OS chrome IS the design system)
- [x] Visual testing - desktop, project pages verified
- [x] Accessibility check (44px touch targets on desktop icons, keyboard nav)
- [x] GitHub Pages deploy config (.github/workflows/deploy.yml)
- [x] Test all easter eggs (Ctrl+K palette, Start menu, BSOD 404)
- [x] Fixed Astro CSS scoping issue (`<style is:global>` on Desktop layout)

## Content Rules (Non-Negotiable)
- NO skills section/grid
- NO "Open to roles" / "Hire me" / "Let's connect"
- NO star counts, repo counts, vanity metrics
- NO "Passionate about" / "Leverage" / "Innovative"
- NO em dashes
- NO loading animations, typewriter effects, scroll-triggered reveals
- NO dark/light mode toggle
- ALL content verbatim from portfolio-content-v2.md
- PRESERVE all arabic-easter-egg spans
