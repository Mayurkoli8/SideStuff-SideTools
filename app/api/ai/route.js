// app/api/ai/route.js
// Server-side proxy to Google Gemini. Free tier, no credit card required.
// Get a key at https://aistudio.google.com/apikey

export const runtime = "edge"; // fast cold starts on Vercel

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req) {
  try {
    const { messages, system, maxTokens = 1000, jsonMode = false } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    // Convert Claude-style messages (role: user/assistant) → Gemini (role: user/model)
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

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
      `?key=${process.env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "upstream error" },
        { status: res.status }
      );
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .filter(Boolean)
      .join("\n");

    if (!text) {
      return Response.json({ error: "empty response" }, { status: 500 });
    }

    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
