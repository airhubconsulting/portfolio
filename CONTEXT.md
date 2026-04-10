# CONTEXT.md
## Angela Guo Portfolio — Session Resume File

Paste this file at the start of a new Claude conversation to resume work on this project.

---

## What this is
A personal portfolio site for Angela Guo — Product Leader, AI System Builder, Occasional Traveler & Investor.

**Live site:** https://angelaguo.pages.dev
**GitHub repo:** https://github.com/airhubconsulting/portfolio
**CMS:** https://angelaguo.pages.dev/admin (Decap CMS, login with GitHub)

---

## Tech stack
- **Hosting:** Cloudflare Pages (free)
- **CMS:** Decap CMS — no-code editor at `/admin`, commits `.md` files to GitHub
- **Chatbot:** Gemini 2.5 Flash API (free tier) via Cloudflare Pages Function
- **Auth:** GitHub OAuth for CMS login
- **No build step** — pure HTML/CSS/JS, Cloudflare serves files directly

---

## File structure
```
portfolio/
├── index.html              ← Homepage: story, philosophy, portfolio preview, blog preview, notes preview
├── blog.html               ← All blog posts (rendered from content/blog/*.md)
├── portfolio.html          ← All projects (rendered from content/portfolio/*.md) + company filter + lightbox
├── philosophy.html         ← All beliefs (hardcoded HTML, append only)
├── notes.html              ← All field notes (rendered from content/notes/*.md)
├── blog/
│   └── post.html           ← Individual blog post page (?slug=filename.md)
├── portfolio/
│   └── post.html           ← Individual portfolio project page (?slug=filename.md) — built but not linked yet
├── _shared.css             ← All styles, used by every page
├── _content.js             ← Content engine: fetches .md files, renders cards/posts/notes
├── _chat.js                ← Chatbot widget JS (shared across all pages)
├── _routes.json            ← Cloudflare function routing
├── _redirects              ← Minimal, no blog URL rewriting (uses query params instead)
├── knowledge.js            ← Chatbot knowledge base (edit to update AI's knowledge about Angela)
├── admin/
│   ├── index.html          ← Decap CMS mount point
│   └── config.yml          ← CMS content type definitions
├── content/
│   ├── blog/               ← Blog post .md files + manifest.json
│   ├── portfolio/          ← Portfolio project .md files + manifest.json
│   └── notes/              ← Field note .md files + manifest.json
└── functions/
    ├── chat.js             ← Gemini API proxy + rate limiter (50/day per IP)
    ├── manifest/
    │   └── [type].js       ← Dynamic manifest: reads GitHub API for live file list
    └── api/auth/callback/
        └── github.js       ← GitHub OAuth handler for Decap CMS login
```

---

## Cloudflare environment variables
| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini chatbot API key (aistudio.google.com) |
| `GITHUB_TOKEN` | Personal access token for auto-manifest (no manual manifest.json edits) |
| `GITHUB_REPO` | `airhubconsulting/portfolio` |
| `OAUTH_CLIENT_ID` | GitHub OAuth App client ID (for Decap CMS login) |
| `OAUTH_CLIENT_SECRET` | GitHub OAuth App client secret |
| `RATE_LIMIT` | KV namespace binding (rate limits chatbot to 50 questions/day per IP) |

---

## Content types (Decap CMS)

### Portfolio (`content/portfolio/*.md`)
Fields: `name`, `company`, `year`, `impact`, `description`, `featured`, `image`, `body` (case study, optional)
Sorted by: year descending
Homepage shows: max 3 where `featured: true`

### Blog (`content/blog/*.md`)
Fields: `title`, `date`, `tag`, `featured`, `body`
Tags: `product`, `build-in-public`, `self`
Sorted by: date descending
Homepage shows: max 3 where `featured: true`
Individual post URL: `/blog/post.html?slug=filename.md`

### Field Notes (`content/notes/*.md`)
Fields: `title` (the observation text), `prefix`, `date`, `featured`
Prefixes: `// work`, `// life`, `// travel`, `// reading`, `// random`
Sorted by: date descending
Homepage shows: max 5 where `featured: true`

---

## How content auto-discovers new files
`_content.js` calls `/manifest/{type}` → hits `functions/manifest/[type].js` → fetches live file list from GitHub API using `GITHUB_TOKEN` → returns array of `.md` filenames. Falls back to static `manifest.json` if GitHub token unavailable.

This means: publish in Decap CMS → `.md` committed to GitHub → Cloudflare redeploys → new content appears automatically.

---

## Chatbot
- Model: `gemini-2.5-flash` (current free tier model as of April 2026)
- Knowledge base: `knowledge.js` — edit this file to update what the bot knows
- Rate limit: 50 questions/day per IP (server-side in `functions/chat.js`)
- If model stops working: check `aistudio.google.com/models` for current free Flash model name, update one line in `functions/chat.js`

---

## Key design decisions made
- **No build step** — plain HTML files, no framework, no npm
- **Blog navigation** — query params (`?slug=`) not clean URLs, avoids Cloudflare redirect loops
- **Portfolio** — no detail page linked yet, cards show on listing page with company filter + image lightbox
- **Philosophy + Notes** — philosophy stays hardcoded HTML (append-only `<li>` blocks); notes moved to CMS
- **Resume** — not published, PDF available on request (email link only)
- **Chatbot** — Gemini free tier, no monthly cost cap needed (Gemini is genuinely free at this traffic level)

---

## Known pending items
- Add real photo to hero (replace AG placeholder): swap `<div class="hero-photo-placeholder">AG</div>` with `<img src="photo.jpg" class="hero-photo">`
- Add screenshots to portfolio cards (upload via `/admin` → Portfolio → edit project → Image field)
- Write real blog posts (3 placeholder posts exist)
- Update `knowledge.js` chatbot brain with latest story/philosophy
- Portfolio detail page (`portfolio/post.html`) is built but cards don't link to it yet — pending decision on case study format

---

## How to add/edit common things

| Task | Where |
|---|---|
| New blog post | `/admin` → Blog → New Post |
| New portfolio project | `/admin` → Portfolio → New Project |
| New field note | `/admin` → Field notes → New Note |
| New philosophy belief | `philosophy.html` → copy `<li class="philosophy-item">` block |
| Add blog tag | `admin/config.yml` options list + `blog.html` filter button |
| Add note prefix | `admin/config.yml` prefix options list |
| Add portfolio company filter | `admin/config.yml` company options + `portfolio.html` filter button |
| Update chatbot knowledge | `knowledge.js` — edit like a document |
| Change chatbot model | `functions/chat.js` → update `GEMINI_MODEL` constant |
