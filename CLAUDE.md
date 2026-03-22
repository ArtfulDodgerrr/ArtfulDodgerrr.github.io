# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A static website (GitHub Pages) themed as a sci-fi "dispatch terminal" — short fictional field reports with commissioned artwork. Pure HTML/CSS/JS, no build system, no frameworks.

**Live at:** https://ArtfulDodgerrr.github.io

## Development

```bash
# Serve locally (Python required)
python -m http.server 8080 --directory C:/ClaudeCode/site

# Or use the configured dev server via Claude Preview:
# launch.json name: "site" (port 8080)
```

No build step. No dependencies to install. Edit files and refresh.

## Adding a New Dispatch

This is the primary recurring task. Three files must be updated:

1. **Create `dispatches/NNN-slug/index.html`** — copy an existing dispatch page as template. Update: title, classification stamp class, h1, dispatch-meta line, dispatch-body paragraphs, prev/next nav links.

2. **Update `dispatches/manifest.json`** — add entry at the top of the array:
```json
{
  "id": "003",
  "slug": "003-slug-name",
  "title": "Title",
  "date": "2026-04-15",
  "classification": "CLASSIFIED|RESTRICTED|OPEN",
  "correspondent": "Name",
  "summary": "One-sentence description.",
  "tags": ["tag1"],
  "images": ["hero.webp"]
}
```

3. **Update `index.html`** — add a new `<li class="dispatch-card">` at the top of the list. Update the record count in the terminal block. Update prev/next links in the new dispatch AND the previously-newest dispatch.

4. **Place images** in `assets/images/dispatch-NNN/` (WebP format, max 1200px wide).

## Architecture

### CSS: Token-driven design system
`tokens.css` is the single source of truth — all colors, fonts, spacing, and timing values are CSS custom properties. Every other CSS file references these tokens. To change the visual identity, edit only `tokens.css`.

Key palette: deep navy backgrounds (`#0a1628`), amber/gold links (`#d4a537`), teal decorative elements (`#007171`). Typography is IBM Plex Mono throughout.

CSS files are split by concern: `reset` → `tokens` → `typography` → `layout` → `halftone` → `components` → `animations` → `dispatch`. All pages include all CSS files (total payload is small).

### JS: Native ES modules, event-driven
`main.js` imports and initializes four modules on DOMContentLoaded:
- `halftone.js` — animated canvas background (breathe ripples + scan pulse + noise drift, capped at ~20fps, pauses when tab hidden)
- `effects.js` — click particle bursts and hover fizz dots (event-driven, no background loops, 30 particle cap)
- `nav.js` — intercepts internal link clicks to play a scan-sweep transition before navigation
- `dispatch-loader.js` — reads manifest.json to update the record count on the index page

All modules export a single `init*()` function. No globals, no coupling between modules.

### URL structure
Dispatches use folder-based clean URLs: `/dispatches/001-phantom-signal/` (each folder contains `index.html`). GitHub Pages serves `index.html` from folders automatically.

### Fallbacks
The halftone CSS pattern (`radial-gradient` dots) renders immediately and is replaced by the canvas when JS loads. The dispatch list is static HTML — `dispatch-loader.js` enhances it but isn't required. All animations respect `prefers-reduced-motion`.

## Classification Badges
Three levels with distinct colors: `badge--classified` (red), `badge--restricted` (amber), `badge--open` (teal). Used on both index cards and dispatch detail stamps.
