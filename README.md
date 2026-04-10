# Angela Guo — Portfolio
## Cloudflare Pages + Decap CMS + Gemini Chatbot

---

## File structure

```
angela-portfolio/
├── index.html              ← Homepage (edit story, philosophy, notes here)
├── portfolio.html          ← All projects (rendered from markdown)
├── blog.html               ← All posts (rendered from markdown)
├── philosophy.html         ← All beliefs (edit directly in HTML)
├── notes.html              ← Field notes (edit directly in HTML)
├── _shared.css             ← All styles — edit here to change design globally
├── _content.js             ← Reads markdown files, renders cards/posts
├── _chat.js                ← Chatbot widget logic (shared across all pages)
├── knowledge.js            ← Chatbot brain — edit to update what the AI knows
├── admin/
│   ├── index.html          ← Decap CMS interface at yoursite.com/admin
│   └── config.yml          ← ✏️ Update repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
├── content/
│   ├── portfolio/
│   │   ├── manifest.json   ← File list (auto-updated if GITHUB_TOKEN is set)
│   │   └── *.md            ← One file per project
│   └── blog/
│       ├── manifest.json   ← File list (auto-updated if GITHUB_TOKEN is set)
│       └── *.md            ← One file per post
├── functions/
│   ├── chat.js             ← Claude API proxy + rate limiter
│   └── manifest/
│       └── [type].js       ← Auto-manifest via GitHub API
└── uploads/                ← Images uploaded via CMS land here
```

---

## One-time setup (~45 minutes total)

### Step 1 — Create GitHub repo (5 min)
1. Go to github.com → New repository → name it `portfolio` → **Public** → Create
2. Upload all files by dragging them into GitHub's web interface
3. Note your repo name — you'll need it as `username/portfolio` in later steps

### Step 2 — Update admin/config.yml (1 min)
Open `admin/config.yml`, find:
```yaml
repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
```
Replace with your actual details. Example:
```yaml
repo: angelaguo/portfolio
```

### Step 3 — Deploy to Cloudflare Pages (5 min)
1. Go to cloudflare.com → sign up free
2. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select your GitHub `portfolio` repo → Begin setup
4. Leave all build settings blank (it's static HTML, no build step)
5. Save and Deploy → your site is live at `yourproject.pages.dev`

### Step 4 — Add environment variables (5 min)
Cloudflare Pages → your project → **Settings** → **Environment variables** → Add:

| Variable | Value | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Your key from aistudio.google.com | Powers the chatbot — free tier |
| `GITHUB_TOKEN` | A GitHub Personal Access Token (see below) | Eliminates manual manifest updates |
| `GITHUB_REPO` | `yourusername/portfolio` | Tells the manifest function where to look |

**Getting a GitHub Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → select scope: `repo` (read access to your repo is enough)
3. Copy it — you only see it once
4. Paste as `GITHUB_TOKEN` in Cloudflare

Once `GITHUB_TOKEN` and `GITHUB_REPO` are set, the site discovers new content files automatically. You never need to edit `manifest.json` again.

### Step 5 — Set up KV namespace for rate limiting (5 min)
This prevents anyone from running up your Claude API bill.

1. Cloudflare dashboard → **Workers & Pages** → **KV** → **Create namespace** → name it `RATE_LIMIT`
2. Back in Pages → your project → **Settings** → **Functions** → **KV namespace bindings**
3. Add binding:
   - Variable name: `RATE_LIMIT`
   - KV namespace: select `RATE_LIMIT`
4. Redeploy (Settings → Deployments → Retry latest deployment)

### Step 6 — Enable GitHub OAuth for Decap CMS (10 min)
This is what lets you log into `yoursite.com/admin` securely with your GitHub account.

1. GitHub → Settings → Developer settings → **OAuth Apps** → **New OAuth App**
   - Application name: `Portfolio CMS`
   - Homepage URL: `https://yoursite.pages.dev`
   - Authorization callback URL: `https://yoursite.pages.dev/api/auth/callback/github`
2. Click **Register application**
3. Note the **Client ID**. Click **Generate a new client secret** and copy it.
4. In Cloudflare Pages → Settings → Environment variables, add:
   - `OAUTH_CLIENT_ID` = Client ID from above
   - `OAUTH_CLIENT_SECRET` = Client Secret from above
5. Redeploy

Now go to `yoursite.pages.dev/admin` → **Login with GitHub** → you're in.

### Step 7 — Custom domain (optional, ~$10/year)
1. Cloudflare dashboard → **Domain Registration** → search `angelaguo.com` or `.dev`
2. Purchase directly through Cloudflare (no markup, no renewal price hike)
3. Pages → your project → **Custom domains** → add your domain
4. DNS configures automatically — usually live within minutes

---

## Day-to-day: adding content

### Add a blog post — no code needed
1. Go to `yoursite.com/admin` → login with GitHub
2. Click **Blog** → **New Post**
3. Fill in 5 fields: Title · Date · Tag · Featured (on/off) · Body
4. Click **Publish** — Decap commits the `.md` file to GitHub
5. Cloudflare auto-deploys in ~30 seconds
6. If `GITHUB_TOKEN` is set: done, it appears automatically
7. If not: open `content/blog/manifest.json` on GitHub, add the filename to the array

### Add a portfolio project — no code needed
1. `yoursite.com/admin` → **Portfolio** → **New Project**
2. Fill in 6 fields: Product name · Company · Year · Impact · Description · Featured · Image (optional)
3. **Publish** → auto-deploys
4. Same manifest note as above applies

### Edit or delete content
1. `yoursite.com/admin` → find the item → edit any field → **Publish**
2. To delete: open the item → **Delete** button (top right of editor)
   - If `GITHUB_TOKEN` is NOT set: also remove the filename from `manifest.json`

### Add a philosophy belief
Open `philosophy.html`, find `<!-- ✏️ ADD MORE BELIEFS HERE -->`, add:
```html
<li class="philosophy-item">
  <span class="phi-num">6</span>
  <p class="phi-text">Your new belief here.</p>
</li>
```
Save → push to GitHub → done.

### Add or edit blog tags
Blog tags appear as filter buttons on the blog page and as dropdown options in the CMS. You need to update **both places** when adding a new tag:

**1 — `admin/config.yml`** — add to the options list:
```yaml
- { label: "Tag", name: tag, widget: select, options: ["product", "build-in-public", "self", "your-new-tag"] }
```

**2 — `blog.html`** — add a filter button:
```html
<button class="filter-btn" data-tag="your-new-tag">#your-new-tag</button>
```

The tag value in `config.yml` must exactly match the `data-tag` in `blog.html` for filtering to work.

**Current tags:** `product` · `build-in-public` · `self`

### Add a field note
Go to `yoursite.com/admin` → **Field notes** → **New Note**
Fill in: Text · Prefix · Date · Featured (on/off) → Publish

### Add or edit field note prefix options
Prefixes are the `// work`, `// life` etc. labels. To add a new one, update **one place**:

**`admin/config.yml`** — find the notes prefix field and add to the options list:
```yaml
- { label: "Prefix", name: prefix, widget: select, options: ["// work", "// life", "// travel", "// reading", "// random", "// your-new-prefix"] }
```

**Current prefixes:** `// work` · `// life` · `// travel` · `// reading` · `// random`

### Add a photo to the hero
1. Put your photo file (e.g. `photo.jpg`) in the root folder
2. In `index.html` find `<div class="hero-photo-placeholder">AG</div>`
3. Replace with: `<img src="photo.jpg" alt="Angela Guo" class="hero-photo">`

---

## The chatbot — powered by Gemini (free)

The "Ask Angela" chatbot is powered by Google's Gemini API — specifically `gemini-1.5-flash`, which has a genuinely free tier with no credit card required.

**Free tier limits:** 15 requests/minute, 1 million tokens/day — far more than a personal portfolio will ever need.

```
Visitor types a question
        ↓
_chat.js sends it to /chat (your Cloudflare Function)
        ↓
functions/chat.js checks rate limit (3/day per IP)
        ↓
Calls Gemini API with your GEMINI_API_KEY (never exposed to browser)
        ↓
Returns Angela's answer
```

### Getting your free Gemini API key
1. Go to **aistudio.google.com**
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key**
4. Copy it → add as `GEMINI_API_KEY` in Cloudflare environment variables
5. No credit card needed, no billing setup required

### Keeping the chatbot up to date
Edit `knowledge.js` whenever something changes — new role, new product shipped, new opinion. The chatbot reads it on every conversation.

### Rate limiting
- Per visitor: max **3 questions per day** (by IP)
- If limit hit: friendly message + directs to your email
- No monthly cap needed — Gemini free tier is genuinely free

---

## How to edit files without git

All files can be edited directly on GitHub's web interface:
1. Go to your repo on github.com
2. Click the file → click the pencil icon (Edit)
3. Make your changes → click **Commit changes**
4. Cloudflare detects the commit and auto-deploys in ~30 seconds

No terminal, no git commands needed.

---

## Full cost breakdown

| Service | Cost |
|---|---|
| Cloudflare Pages hosting | **Free** |
| Cloudflare Pages Functions (chat proxy, manifest) | **Free** (100k req/month) |
| Cloudflare KV (rate limiter) | **Free** (100k reads/day) |
| Decap CMS | **Free** (open source, self-hosted) |
| GitHub repo | **Free** |
| Gemini API (chatbot) | **Free** (gemini-1.5-flash free tier) |
| Custom domain (optional) | **~$10/year** via Cloudflare Registrar |

**Total: $0/month. ~$10/year if you want a custom domain.**

---

## Environment variables — complete reference

| Variable | Required | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | Yes | aistudio.google.com → Get API Key |
| `GITHUB_TOKEN` | Recommended | GitHub → Settings → Developer settings → Personal access tokens |
| `GITHUB_REPO` | Recommended | `yourusername/portfolio` |
| `OAUTH_CLIENT_ID` | Yes (for CMS) | GitHub → Settings → Developer settings → OAuth Apps |
| `OAUTH_CLIENT_SECRET` | Yes (for CMS) | Same OAuth App page |
