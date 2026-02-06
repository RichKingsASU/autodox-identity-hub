

# Optimize CSS for Faster First Paint

## Problem
The single CSS bundle (`index-BtigvdLU.css`, 14.3 KiB) is render-blocking, delaying First Contentful Paint (FCP) and Largest Contentful Paint (LCP). Lighthouse reports ~11.9 KiB of unused CSS on the landing page. Two root causes:

1. **7 font-face files** imported eagerly in `index.css` -- all weights load upfront even if the landing page only uses 2-3
2. **`App.css`** is a leftover Vite boilerplate file (41 lines of unused rules like `.logo`, `.card`, `.read-the-docs`) -- while not currently imported, it should be deleted for hygiene
3. **IBM Plex Mono** (2 weights) is only used for `code`/`pre` elements, which don't appear above the fold

## Solution

### 1. Remove unused `App.css`
Delete `src/App.css` entirely. It contains Vite starter template styles that are never imported.

### 2. Reduce font weight imports
Keep only the weights actually used on the landing page loaded eagerly. Defer the rest:

**Keep eager (used in body text, headings, buttons):**
- Plus Jakarta Sans 400 (body)
- Plus Jakarta Sans 600 (semi-bold UI elements)  
- Plus Jakarta Sans 700 (headings)

**Remove from global CSS (used only in specific pages/components):**
- Plus Jakarta Sans 500 -- only used sparingly, browser synthesizes fine
- Plus Jakarta Sans 800 -- only used in a few hero headings, can load on demand
- IBM Plex Mono 400, 500 -- only for code blocks, not above-the-fold

### 3. Lazy-load deferred fonts
Import the removed font weights directly in the components that use them (e.g., import IBM Plex Mono in code-block components, import 800 weight in hero components). This way Vite's code splitting ensures they only load when needed.

## Files Changed

| File | Change |
|------|--------|
| `src/App.css` | Delete (unused Vite boilerplate) |
| `src/index.css` | Remove 4 font `@import` lines (500, 800, and both Mono weights) |
| `src/components/landing/HeroSection.tsx` | Add `import '@fontsource/plus-jakarta-sans/800.css'` for extrabold headings |
| Components using `font-mono` / `code` | Add `import '@fontsource/ibm-plex-mono/400.css'` where needed |

## Expected Impact
- CSS bundle drops from ~14.3 KiB to ~8-9 KiB
- Unused CSS on landing page drops from 11.9 KiB to ~3-4 KiB
- FCP/LCP improve by removing render-blocking font CSS that isn't needed above the fold
- No visual change -- all fonts still load, just at the right time

