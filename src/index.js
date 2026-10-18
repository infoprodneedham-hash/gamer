export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Intercept only POST /api/chat for the AI Terminal
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const userMessage = body?.userMessage?.trim();

        if (!userMessage) {
          return new Response(JSON.stringify({ error: "Missing userMessage parameter." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const systemPrompt = `You are CHRONO RIG, an expert AI terminal specializing in PC gaming architecture and history.
Your domain covers:
- The 1990s: VGA real-mode, id Tech 1/2 BSP partitioning, GLQuake, and 3dfx Glide rasterization.
- The 2000s: DirectX 8/9 programmable vertex/pixel shaders, Havok physics (Half-Life 2), and unified DirectX 10 pipelines (CryEngine 2).
- The 2010s: Modern digital distribution, x86-64 multi-threaded optimization, Vulkan, and DirectX 12.
- The 2020s: Real-time hardware BVH path tracing, AI temporal reconstruction (DLSS/FSR), and CRPG revivals.

Provide technical, accurate, concise, and engaging answers.`;

        // Run Meta Llama 3.1 Instruct with native streaming
        const aiStream = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          stream: true,
          max_tokens: 768,
          temperature: 0.6
        });

        return new Response(aiStream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Inference fault", details: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 2. Serve static assets (HTML, CSS, images) from the ./public directory
    return env.ASSETS.fetch(request);
  }
};