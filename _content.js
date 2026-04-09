// ============================================================
// _content.js — Content engine
// Fetches .md files from /content/, parses frontmatter,
// renders portfolio cards and blog posts dynamically.
// Used by index.html, portfolio.html, blog.html
// ============================================================

// ── Frontmatter parser ────────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { body: raw, data: {} };
  const body = raw.slice(match[0].length).trim();
  const data = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Boolean
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    data[key] = val;
  });
  return { data, body };
}

// ── Fetch a content index ─────────────────────────────────
// Cloudflare Pages serves directory listings as JSON when
// you add a _redirects or use the file list endpoint.
// We maintain a simple manifest file instead — more reliable.
async function fetchManifest(type) {
  try {
    const res = await fetch(`/content/${type}/manifest.json`);
    if (!res.ok) return [];
    return await res.json(); // array of filenames e.g. ["shop-the-look.md"]
  } catch { return []; }
}

// ── Fetch and parse one content file ─────────────────────
async function fetchEntry(type, filename) {
  try {
    const res = await fetch(`/content/${type}/${filename}`);
    if (!res.ok) return null;
    const raw = await res.text();
    const { data, body } = parseFrontmatter(raw);
    data._body = body;
    data._filename = filename;
    return data;
  } catch { return null; }
}

// ── Load all entries of a type ────────────────────────────
async function loadAll(type) {
  const files = await fetchManifest(type);
  const entries = await Promise.all(files.map(f => fetchEntry(type, f)));
  return entries.filter(Boolean);
}

// ── Simple markdown → HTML (bold, italic, paragraphs, links)
function simpleMarkdown(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ── Render portfolio card ─────────────────────────────────
function portfolioCard(p, featured = false) {
  const img = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : `<div class="portfolio-card-media-placeholder">📸 Add screenshot</div>`;
  return `
    <div class="portfolio-card${featured ? ' featured' : ''}">
      <div class="portfolio-card-media">${img}</div>
      <div class="portfolio-card-body">
        <div class="portfolio-card-co">${p.company} · ${p.year}</div>
        <div class="portfolio-card-title">${p.name}</div>
        <div class="portfolio-card-impact">${p.impact}</div>
        <div class="portfolio-card-desc">${p.description}</div>
      </div>
    </div>`;
}

// ── Render blog row ───────────────────────────────────────
function blogRow(post) {
  const date = post.date ? post.date.slice(0, 7).replace('-', '/') : '';
  const excerpt = post._body
    ? post._body.replace(/[#*`]/g, '').slice(0, 120).trim() + '…'
    : '';
  return `
    <div class="blog-item" data-tag="${post.tag || ''}" data-file="${post._filename}">
      <div>
        <div class="bi-tag">#${post.tag || ''}</div>
        <div class="bi-title">${post.title}</div>
        ${excerpt ? `<div class="bi-excerpt">${excerpt}</div>` : ''}
      </div>
      <div class="bi-date">${date}</div>
    </div>`;
}

// ── Sort helpers ──────────────────────────────────────────
function byDateDesc(a, b) {
  return (b.date || '').localeCompare(a.date || '');
}
function byYearDesc(a, b) {
  const ya = parseInt((a.year || '0').slice(-4));
  const yb = parseInt((b.year || '0').slice(-4));
  return yb - ya;
}

// ── Render homepage portfolio preview (3 featured) ────────
async function renderHomepagePortfolio(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const all = await loadAll('portfolio');
  const featured = all.filter(p => p.featured).sort(byYearDesc).slice(0, 3);
  if (!featured.length) { el.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;">No featured projects yet.</p>'; return; }
  el.innerHTML = featured.map((p, i) => portfolioCard(p, i === 0)).join('');
}

// ── Render full portfolio page ────────────────────────────
async function renderFullPortfolio(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const all = await loadAll('portfolio');
  all.sort(byYearDesc);
  if (!all.length) { el.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;">No projects yet — add one in /admin.</p>'; return; }
  // First entry gets featured treatment
  el.innerHTML = all.map((p, i) => portfolioCard(p, i === 0)).join('');
}

// ── Render homepage blog preview (3 featured) ────────────
async function renderHomepageBlog(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const all = await loadAll('blog');
  const featured = all.filter(p => p.featured).sort(byDateDesc).slice(0, 3);
  if (!featured.length) { el.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;">No featured posts yet.</p>'; return; }
  el.innerHTML = featured.map(blogRow).join('');
  attachBlogClicks(el);
}

// ── Render full blog page ─────────────────────────────────
async function renderFullBlog(containerId, activeTag) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const all = await loadAll('blog');
  all.sort(byDateDesc);
  if (!all.length) { el.innerHTML = '<p style="color:var(--ink-faint);font-size:13px;">No posts yet — add one in /admin.</p>'; return; }
  el.innerHTML = all.map(blogRow).join('');
  attachBlogClicks(el);
  if (activeTag && activeTag !== 'all') filterBlog(containerId, activeTag);
}

// ── Filter blog by tag ────────────────────────────────────
function filterBlog(containerId, tag) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.querySelectorAll('.blog-item').forEach(item => {
    item.style.display = (tag === 'all' || item.dataset.tag === tag) ? 'grid' : 'none';
  });
}

// ── Blog post click → open post inline ───────────────────
function attachBlogClicks(container) {
  container.querySelectorAll('.blog-item').forEach(item => {
    item.addEventListener('click', async () => {
      const file = item.dataset.file;
      if (!file) return;
      const post = await fetchEntry('blog', file);
      if (!post) return;
      openPost(post);
    });
  });
}

// ── Inline post reader ────────────────────────────────────
function openPost(post) {
  const existing = document.getElementById('post-overlay');
  if (existing) existing.remove();

  const date = post.date ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const overlay = document.createElement('div');
  overlay.id = 'post-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(24,18,14,0.5);
    z-index:2000;display:flex;align-items:flex-start;justify-content:center;
    padding:40px 20px;overflow-y:auto;
  `;
  overlay.innerHTML = `
    <div style="
      background:var(--paper);max-width:640px;width:100%;
      border-radius:12px;padding:40px 48px 56px;position:relative;
    ">
      <button onclick="document.getElementById('post-overlay').remove()" style="
        position:absolute;top:20px;right:20px;background:none;border:none;
        font-size:18px;color:var(--ink-faint);cursor:pointer;line-height:1;
      ">✕</button>
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faint);margin-bottom:10px;">#${post.tag || ''} · ${date}</div>
      <h1 style="font-size:24px;font-weight:600;color:var(--ink);line-height:1.25;letter-spacing:-0.02em;margin-bottom:28px;">${post.title}</h1>
      <div style="font-size:16px;line-height:1.85;color:var(--ink);">${simpleMarkdown(post._body)}</div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── Blog filter buttons ───────────────────────────────────
function initBlogFilters(containerId) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterBlog(containerId, btn.dataset.tag);
    });
  });
}
