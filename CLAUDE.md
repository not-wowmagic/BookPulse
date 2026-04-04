# BookPulse — Project Instructions

## Brand
- **Name**: BookPulse
- **Tagline**: Real-Time Book Trends from the Filipino Reading Pulse
- **Market**: Philippines-first. All data sources prioritize PH communities.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check
```

## Architecture

- `src/components/` — All UI components (Navbar, Hero, Features, TrendingBoard, DataProtocol, BookCover, Footer)
- `src/data/` — Real trending data separated by platform (BookTokPH, r/phbookclub, Goodreads)
- `src/hooks/` — Custom hooks (useBookData polling, useBookCover cover resolution)
- `src/App.jsx` — Root layout and section orchestration

## Data Sources & APIs

- **Open Library Covers API**: `covers.openlibrary.org/b/isbn/{ISBN}-M.jpg` — Primary cover source (no rate limits on img tags)
- **Google Books API**: `googleapis.com/books/v1/volumes?q={query}` — Fallback covers (queued with 300ms throttle)
- **Book Data**: Real trending titles sourced from BookTokPH hashtags, r/phbookclub threads, and Goodreads Philippines shelves
- **Trending Board**: Three separate platform sections, each with platform-specific stats (Mentions/Discussions/Reviews)
- `src/index.css` — Global styles, Tailwind directives, noise overlay, typography

## Design System — Brutalist Signal (Preset C)

### Palette
- Paper: `#E8E4DD` — Primary background
- Signal Red: `#E63B2E` — Accents, CTAs, active states
- Off-white: `#F5F3EE` — Card surfaces
- Black: `#111111` — Primary text
- Mid-gray: `#6B6B6B` — Secondary text

### Typography (Google Fonts)
- **Headings**: Space Grotesk 700
- **Drama/Editorial**: DM Serif Display 400 Italic
- **Data/Monospace**: Space Mono 400

### Animation Doctrine (GSAP 3)
- Ease: `power3.out` (default), `power2.inOut` (scroll)
- No bounce. No elastic. Weighted, intentional motion only.
- Stagger: `0.08s`. Duration: `0.6s`–`1.4s`.
- ScrollTrigger for all below-fold content.
- Noise overlay at `0.05` opacity, `position: fixed`, `pointer-events: none`.

### Component Radii & Spacing
- All containers: `border-radius: 2rem`
- Card padding: `2rem`
- Section gaps: `8rem`

## Platforms Tracked
1. BookTokPH (TikTok)
2. r/phbookclub (Reddit)
3. Goodreads

## Key Decisions
- Mock data polling every 60s via `useEffect` to simulate real-time sync.
- GSAP ScrollTrigger for stacking card reveals in Data Protocol section.
- Mobile-first responsive: all card grids stack vertically on small screens.
- No ads, no clutter. Brutalist clarity.

## Don'ts
- No generic color schemes. Use only the Brutalist Signal palette.
- No bounce/elastic easing. Ever.
- No placeholder images — generate or use real covers.
- No filler text. Every word must be intentional.
