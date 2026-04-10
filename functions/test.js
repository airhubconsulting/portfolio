// Temporary test function — delete after chatbot is working
// Visit: yoursite.com/test to see the result

export async function onRequestGet(context) {
  const { env } = context;

  const cors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Check 1: Is the API key present?
  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({
      status: "error",
      message: "GEMINI_API_KEY is not set"
    }), { headers: cors });
  }

  // Check 2: Can we reach Gemini?
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say hello in one word" }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    const text = await response.text();

    return new Response(JSON.stringify({
      status: response.ok ? "success" : "error",
      gemini_status: response.status,
      gemini_response: text.slice(0, 500)
    }), { headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: err.message
    }), { headers: cors });
  }
}
