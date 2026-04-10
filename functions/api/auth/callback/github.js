// functions/api/auth/callback/github.js
// Handles GitHub OAuth callback for Decap CMS
// Exchanges the OAuth code for a token and returns it to the CMS

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // DEBUG — remove after fixing
  if (!code) {
    return new Response(
      `<h2>Debug info</h2>
      <p>Full URL: ${request.url}</p>
      <p>All params: ${url.searchParams.toString()}</p>
      <p>Code: ${code}</p>
      <p>State: ${state}</p>`,
      { headers: { "Content-Type": "text/html" } }
    );
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
