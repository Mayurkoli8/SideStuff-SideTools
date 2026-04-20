// app/api/claude/route.js
// Server-side proxy so the ANTHROPIC_API_KEY never touches the browser.

export const runtime = "edge"; // fast cold starts on Vercel

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(req) {
  try {
    const { messages, system, maxTokens = 1000 } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    const body = {
      model: MODEL,
      max_tokens: Math.min(Number(maxTokens) || 1000, 2000),
      messages,
    };
    if (system) body.system = system;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data?.error?.message || "upstream error" }, { status: res.status });
    }

    const text = (data.content || [])
      .map((c) => (c && c.type === "text" ? c.text : ""))
      .filter(Boolean)
      .join("\n");

    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
