// app/api/ai/route.js
// Server-side proxy to Groq. Free tier: 30 RPM / 14,400 RPD on Llama 3.3 70B.
// No credit card. Get a key at https://console.groq.com/keys

export const runtime = "nodejs";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req) {
  try {
    const { messages, system, maxTokens = 1000, jsonMode = false } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({
        error: "GROQ_API_KEY not set",
        hint: "Add GROQ_API_KEY in Vercel → Settings → Environment Variables, then REDEPLOY (env vars don't apply to existing deployments).",
      }, { status: 500 });
    }

    // Groq uses OpenAI-compatible format. system becomes role:"system"
    const fullMessages = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const body = {
      model: MODEL,
      messages: fullMessages,
      max_tokens: Math.min(Number(maxTokens) || 1000, 2000),
      temperature: 0.7,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error?.message || `Groq returned HTTP ${res.status}`;
      const hint =
        res.status === 401 ? "API key invalid or missing. Get one at https://console.groq.com/keys"
      : res.status === 429 ? "Rate limited. Free tier: 30 RPM / 14,400 RPD. Wait ~30s and try again."
      : res.status === 404 ? `Model '${MODEL}' not found. Try llama-3.3-70b-versatile or llama-3.1-8b-instant.`
      : res.status === 503 ? "Groq is temporarily overloaded. Try again in a moment."
      : res.status === 400 && /json/i.test(msg || "") ? "System prompt needs to mention 'JSON' when jsonMode is on."
      : undefined;
      console.error("[Groq error]", res.status, msg);
      return Response.json({ error: msg, hint, status: res.status }, { status: res.status });
    }

    const choice = data?.choices?.[0];
    const text = choice?.message?.content || "";

    if (!text) {
      return Response.json({
        error: "empty response",
        hint: choice?.finish_reason ? `finish reason: ${choice.finish_reason}` : undefined,
      }, { status: 500 });
    }

    return Response.json({ text });
  } catch (err) {
    console.error("[Route error]", err);
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
