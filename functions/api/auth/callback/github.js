// functions/api/auth/callback/github.js
// Handles GitHub OAuth for Decap CMS — two flows:
// 1. Initial: Decap calls this to start auth → we redirect to GitHub
// 2. Callback: GitHub redirects back with ?code → we exchange for token

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const provider = url.searchParams.get("provider");
  const siteId = url.searchParams.get("site_id");

  // ── Flow 1: Initial request from Decap — redirect to GitHub ──
  if (!code) {
    const scope = url.searchParams.get("scope") || "repo";
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `https://${siteId}/api/auth/callback/github`;

    const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
    githubAuthUrl.searchParams.set("client_id", env.OAUTH_CLIENT_ID);
    githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
    githubAuthUrl.searchParams.set("scope", scope);
    githubAuthUrl.searchParams.set("state", state);

    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  // ── Flow 2: GitHub callback with code — exchange for token ──
  try {
    const redirectUri = `https://angelaguo.pages.dev/api/auth/callback/github`;

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: env.OAUTH_CLIENT_ID,
        client_secret: env.OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        `<!DOCTYPE html><html><body><script>
          window.opener.postMessage(
            JSON.stringify({ error: "${tokenData.error}" }),
            "*"
          );
          window.close();
        </script></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const token = tokenData.access_token;

    // Send token back to Decap CMS
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Authenticating...</title></head>
      <body>
        <script>
          (function() {
            function receiveMessage(e) {
              window.opener.postMessage(
                'authorization:github:success:{"token":"${token}","provider":"github"}',
                e.origin
              );
            }
            window.addEventListener("message", receiveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })()
        </script>
        <p>Authenticating, please wait...</p>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    return new Response(`Authentication error: ${err.message}`, { status: 500 });
  }
}


  // Exchange code for access token
  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: env.OAUTH_CLIENT_ID,
        client_secret: env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        `<script>
          window.opener.postMessage(
            JSON.stringify({ error: "${tokenData.error}", errorDescription: "${tokenData.error_description}" }),
            "*"
          );
          window.close();
        </script>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const token = tokenData.access_token;

    // Send token back to Decap CMS via postMessage
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Authenticating...</title></head>
      <body>
        <script>
          (function() {
            function receiveMessage(e) {
              console.log("receiveMessage %o", e);
              window.opener.postMessage(
                'authorization:github:success:{"token":"${token}","provider":"github"}',
                e.origin
              );
            }
            window.addEventListener("message", receiveMessage, false);
            window.opener.postMessage("authorizing:github", "*");
          })()
        </script>
        <p>Authenticating, please wait...</p>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    return new Response(`Authentication error: ${err.message}`, { status: 500 });
  }
}
