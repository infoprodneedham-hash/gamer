export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { userMessage, pageContent } = await request.json();

    const systemPrompt = `You are a helpful assistant for this website.
Persona: Professional, concise, and helpful.

RULES:
1. Answer the question using ONLY the provided Page Context below.
2. If the answer cannot be found in the Page Context, state: "I can only answer questions regarding the information on this page."
3. Do not invent facts or use outside knowledge.

--- PAGE CONTEXT ---
${pageContent || "No context provided."}`;

    // Cloudflare Workers AI binding running Llama
    const responseStream = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true,
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}