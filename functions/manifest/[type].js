// functions/manifest/[type].js
// Serves /manifest/portfolio and /manifest/blog
// Returns list of .md files in each content directory
// This auto-updates — no manual manifest editing needed after setup

export async function onRequestGet(context) {
  const { params, env } = context;
  const type = params.type;

  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Valid content types only
  if (!['portfolio', 'blog'].includes(type)) {
    return new Response(JSON.stringify([]), { headers: cors });
  }

  // If GITHUB_TOKEN env var is set, fetch file list from GitHub API
  // This gives us a live manifest without a static JSON file
  if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/contents/content/${type}`,
        { headers: { Authorization: `token ${env.GITHUB_TOKEN}`, 'User-Agent': 'angela-portfolio' } }
      );
      if (res.ok) {
        const files = await res.json();
        const mdFiles = files
          .filter(f => f.name.endsWith('.md'))
          .map(f => f.name)
          .sort()
          .reverse(); // newest first for blog (date-prefixed filenames)
        return new Response(JSON.stringify(mdFiles), { headers: cors });
      }
    } catch { /* fall through to static manifest */ }
  }

  // Fallback: serve static manifest.json from content directory
  // This is what's used initially — update manifest.json when adding files
  try {
    const manifestUrl = new URL(`/content/${type}/manifest.json`, context.request.url);
    const res = await fetch(manifestUrl.toString());
    if (res.ok) {
      const data = await res.text();
      return new Response(data, { headers: cors });
    }
  } catch { /* fall through */ }

  return new Response(JSON.stringify([]), { headers: cors });
}
