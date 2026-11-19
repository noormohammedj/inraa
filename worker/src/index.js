// Inraa proposal writer: a Cloudflare Worker that asks Claude to write the proposal text.
// The website sends the client's problem plus the effort and price already worked out by the
// in-browser agent; Claude writes the narrative around those fixed numbers and returns Markdown.
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You write formal result plans (technical and commercial proposals) for Inraa Solution, a Result as a Service (RaaS) company in India.
Inraa does not sell software licences: it builds, runs and improves systems and is judged on business results (cost cut, work automated, revenue that keeps coming in while the owner is away), reported monthly.
Inraa delivers with a lean squad (one senior engineer plus one reviewer/tester) using AI coding assistants (Claude, ChatGPT), with every change reviewed by a person.
Stack: React + TypeScript, Capacitor for Android/iPhone, Supabase (PostgreSQL, Mumbai region), Razorpay/UPI, Meta WhatsApp Cloud API, MSG91 SMS; AI features use Anthropic Claude or OpenAI APIs.
Limits you must state honestly: no custom model training, no on-premise GPUs, no hardware supply, AI output that affects money, health or legal records is confirmed by a person, support during business hours IST.
Use ONLY the module list, days, prices and weeks given in the request. Never invent or change a number. Amounts are Indian rupees, exclusive of 18% GST.
Write in plain, confident business English for an Indian small-business owner. Output Markdown only, with these sections:
1. Summary  2. Results we will deliver (with how each is measured)  3. Proposed solution (modules as a table)  4. Architecture  5. Delivery plan and timeline
6. Commercials (Option A one-time build plus monthly running cost, Option B monthly subscription, payment milestones 30/40/30)
7. Assumptions and limitations  8. Next steps.`;

const cors = (origin) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "https://inraasolution.com,https://www.inraasolution.com").split(",");
    const allow = allowed.includes(origin) ? origin : allowed[0];
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(allow) });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors(allow) });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors(allow) }); }
    const problem = String(body.problem || "").slice(0, 4000);
    if (problem.length < 20) return Response.json({ error: "Problem statement too short" }, { status: 400, headers: cors(allow) });

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const message = await client.beta.messages
        .stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium" },
          system: SYSTEM,
          messages: [{
            role: "user",
            content: "Write the proposal for this client.\n\n" + JSON.stringify({
              business: body.business, contact: body.contact, industry: body.industry, problem,
              modules: body.modules, totals: body.totals, company: body.company,
            }, null, 2),
          }],
        })
        .finalMessage();

      if (message.stop_reason === "refusal") return Response.json({ error: "Declined" }, { status: 422, headers: cors(allow) });
      const markdown = message.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return Response.json({ markdown }, { headers: cors(allow) });
    } catch (err) {
      const status = err instanceof Anthropic.RateLimitError ? 429 : err instanceof Anthropic.APIError ? 502 : 500;
      return Response.json({ error: "Proposal service unavailable" }, { status, headers: cors(allow) });
    }
  },
};
