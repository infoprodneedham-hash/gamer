export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS Preflight if hosted on a separate subdomain
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Route only matches POST /api/chat
    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const payload = await request.json();
      const userMessage = payload?.userMessage?.trim();
      const pageContent = payload?.pageContent?.trim() || "";

      if (!userMessage) {
        return new Response(JSON.stringify({ error: "Missing userMessage" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Grounding prompt with the parsed page context
      const systemPrompt = `You are the OVERCLOCK Terminal Intelligence, an expert PC gaming dossier assistant.
Your knowledge includes PC gaming hardware architecture (3dfx Glide, DirectX eras, shader models, path-tracing), watershed PC title milestones (DOOM, Quake, Deus Ex, Half-Life 2, Crysis), and community genre debates.

When answering, reference details from the provided Dossier Document whenever relevant:
--- DOSSIER CONTEXT ---
${pageContent.slice(0, 10000)}
-----------------------

Style guide:
- Tone: Tactical, crisp, authoritative, slightly cyberpunk/hacker aesthetic.
- Be concise, technical, and accurate. Avoid patronizing filler.`;

      // Call Cloudflare Workers AI with streaming enabled
      // You can use "@cf/meta/llama-3.1-8b-instruct" or "@cf/meta/llama-3.1-8b-instruct-fp8"
      const aiStream = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
        max_tokens: 1024,
        temperature: 0.5,
      });

      // Stream the response directly back as an SSE stream
      return new Response(aiStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      console.error("[API_CHAT_ERROR]", err);
      return new Response(
        JSON.stringify({ error: "Inference failed", details: err.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};