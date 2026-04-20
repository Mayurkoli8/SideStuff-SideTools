// app/api/ai/route.js
// Server-side proxy to Google Gemini. Free tier, no credit card required.
// Get a key at https://aistudio.google.com/apikey

export const runtime = "nodejs"; // more forgiving than edge on Vercel hobby tier

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req) {
  try {
    const { messages, system, maxTokens = 1000, jsonMode = false } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({
        error: "GEMINI_API_KEY not set",
        hint: "Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then REDEPLOY (env vars don't apply to existing deployments).",
      }, { status: 500 });
    }

    // Claude-style messages (role: user/assistant) → Gemini (role: user/model)
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: Math.min(Number(maxTokens) || 1000, 2000),
        temperature: 0.7,
        ...(jsonMode && { responseMimeType: "application/json" }),
      },
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey, // header auth, per Google's current docs
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error?.message || `Gemini returned HTTP ${res.status}`;
      const hint =
        res.status === 400 ? "Check that GEMINI_MODEL is a valid model name (e.g. gemini-2.5-flash)."
      : res.status === 401 || res.status === 403 ? "API key invalid, rejected, or blocked for your region. Verify at https://aistudio.google.com/apikey"
      : res.status === 404 ? `Model '${MODEL}' not found. Try gemini-2.5-flash, gemini-2.5-flash-lite, or gemini-2.5-pro.`
      : res.status === 429 ? "Free tier quota hit for today. Wait until midnight Pacific, or set GEMINI_MODEL=gemini-2.5-flash-lite (1000/day instead of 500)."
      : res.status === 503 ? "Google's API is overloaded or your region is rate-limited. Try again in a moment."
      : undefined;
      console.error("[Gemini error]", res.status, msg, data);
      return Response.json({ error: msg, hint, status: res.status }, { status: res.status });
    }

    // Safety blocks surface as either no candidates, or finishReason = SAFETY
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      const blockReason = data?.promptFeedback?.blockReason;
      return Response.json({
        error: "no response generated",
        hint: blockReason ? `blocked by safety filter: ${blockReason}` : "try rephrasing the input",
      }, { status: 500 });
    }

    const text = (candidate.content?.parts || [])
      .map((p) => p.text || "")
      .filter(Boolean)
      .join("\n");

    if (!text) {
      return Response.json({
        error: "empty response",
        hint: candidate.finishReason ? `finish reason: ${candidate.finishReason}` : undefined,
      }, { status: 500 });
    }

    return Response.json({ text });
  } catch (err) {
    console.error("[Route error]", err);
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
