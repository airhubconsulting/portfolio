// functions/api/auth/callback/github.js
// Handles GitHub OAuth for Decap CMS
// Flow 1 - no code: redirect to GitHub for authorization
// Flow 2 - has code: exchange for token and pass back to Decap

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const siteId = url.searchParams.get("site_id") || "angelaguo.pages.dev";
  const scope = url.searchParams.get("scope") || "repo";
  const callbackUrl = "https://angelaguo.pages.dev/api/auth/callback/github";

  // Flow 1: No code yet — redirect to GitHub to authorize
  if (!code) {
    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", env.OAUTH_CLIENT_ID);
    githubUrl.searchParams.set("redirect_uri", callbackUrl);
    githubUrl.searchParams.set("scope", scope);
    return Response.redirect(githubUrl.toString(), 302);
  }

  // Flow 2: Got code back from GitHub — exchange for token
  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: env.OAUTH_CLIENT_ID,
        client_secret: env.OAUTH_CLIENT_SECRET,
        code: code,
        redirect_uri: callbackUrl,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return new Response(
        `<!DOCTYPE html><html><body>
        <script>window.opener.postMessage('authorization:github:error:' + JSON.stringify({message:"${data.error}"}), "*"); window.close();</script>
        </body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const token = data.access_token;

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
          })();
        </script>
        <p>Authenticating, please wait...</p>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    return new Response("Authentication error: " + err.message, { status: 500 });
  }
}
