export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const { message } = await request.json();

      // Direct fallback using Cloudflare Workers AI free REST gateway
      // This bypasses the need for the manual dashboard binding
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID || 'dummy'}/ai/run/@cf/meta/llama-3-8b-instruct`,
        {
          headers: { Authorization: `Bearer ${env.CF_AI_TOKEN}` },
          method: "POST",
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a helpful assistant on my website." },
              { role: "user", content: message }
            ]
          })
        }
      );

      const data = await response.json();
      const reply = data.result?.response || "I couldn't process that.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ reply: 'Sorry, something went wrong.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};