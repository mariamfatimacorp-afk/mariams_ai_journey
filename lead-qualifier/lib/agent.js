import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { saveLead } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, "..", "config.json"), "utf8"));

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

// ---------------------------------------------------------------------------
// Tool definition — the agent extracts qualification data through this tool.
// strict: true guarantees the input validates against the schema exactly.
// ---------------------------------------------------------------------------
const saveLeadTool = {
  name: "save_lead",
  description:
    "Save or update the qualified lead captured from this conversation. " +
    "Call this as soon as you have the visitor's name and email, and call it " +
    "again whenever you learn new qualification details (budget, timeline, " +
    "decision authority, need). Calling it multiple times updates the same lead.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Visitor's full name" },
      email: { type: "string", description: "Visitor's email address" },
      phone: { type: ["string", "null"], description: "Phone number if given" },
      company: { type: ["string", "null"], description: "Company or business name if given" },
      budget_range: {
        type: "string",
        enum: ["under_1k", "1k_5k", "5k_25k", "over_25k", "unknown"],
        description: "Visitor's stated budget band. Use 'unknown' if they haven't said.",
      },
      timeline: {
        type: "string",
        enum: ["asap", "1_3_months", "3_6_months", "just_researching", "unknown"],
        description: "When they want the project done. Use 'unknown' if unclear.",
      },
      is_decision_maker: {
        type: "boolean",
        description: "True if the visitor can make the buying decision themselves.",
      },
      has_clear_need: {
        type: "boolean",
        description: "True if the visitor articulated a specific, concrete need our services solve.",
      },
      need_summary: {
        type: "string",
        description: "One or two sentences summarizing what the visitor needs.",
      },
      notes: {
        type: ["string", "null"],
        description: "Anything else useful for the sales team (objections, competitors mentioned, context).",
      },
    },
    required: [
      "name", "email", "phone", "company", "budget_range", "timeline",
      "is_decision_maker", "has_clear_need", "need_summary", "notes",
    ],
    additionalProperties: false,
  },
};

// ---------------------------------------------------------------------------
// Deterministic scoring — done in code, not by the model, so results are
// consistent and auditable. BANT-style: Budget, Authority, Need, Timeline.
// ---------------------------------------------------------------------------
export function scoreLead(input) {
  const q = config.qualification;
  let score = 0;
  score += q.budget_bands[input.budget_range] ?? q.budget_bands.unknown;
  score += q.timeline_bands[input.timeline] ?? q.timeline_bands.unknown;
  if (input.is_decision_maker) score += q.decision_maker_points;
  if (input.has_clear_need) score += q.clear_need_points;
  const tier = score >= q.hot_threshold ? "hot" : score >= q.warm_threshold ? "warm" : "cold";
  return { score, tier };
}

function buildSystemPrompt() {
  const b = config.business;
  const a = config.agent;
  return `You are ${a.name}, the friendly lead qualification assistant on the website of ${b.name}.

About the business: ${b.description}
Services offered:
${b.services.map((s) => `- ${s}`).join("\n")}
Typical project range: ${b.typical_project_range}

Your job, in order:
1. Answer the visitor's questions about the business helpfully and honestly. If you don't know something specific (exact pricing for their case, availability), say the team will confirm on a call.
2. Naturally qualify them during the conversation. Work these in one at a time, conversationally — never as a form or a list:
   - What they need (their project or problem)
   - Their rough budget
   - Their timeline
   - Whether they're the decision maker
   - Their name and email (ask for these once there's genuine interest — frame it as "so the team can follow up")
3. As soon as you have their name and email, call the save_lead tool. Call it again whenever you learn more (budget, timeline, etc.) — repeated calls update the same lead.
4. For strong leads (clear need, budget, near-term timeline), invite them to book a call: ${b.calendar_link}

Tone: ${a.tone}

Rules:
- Keep replies short — 1 to 3 sentences, one question at a time.
- Never invent prices, discounts, or commitments the business hasn't stated.
- Never mention the save_lead tool, scoring, or that you are qualifying them.
- If the visitor is clearly not a fit (looking for something the business doesn't do), politely say so and don't push for contact details.
- If the visitor asks whether they're talking to an AI, be honest.`;
}

async function dispatchWebhook(record) {
  const url = config.notifications?.webhook_url;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
  } catch (err) {
    console.error("Webhook delivery failed:", err.message);
  }
}

export function getOpeningMessage() {
  return config.agent.opening_message;
}

// ---------------------------------------------------------------------------
// One conversational turn. `history` is the session's MessageParam[] array;
// this mutates it in place (appends the user turn, assistant turns, and any
// tool results) and returns the assistant's final text reply.
// ---------------------------------------------------------------------------
export async function runTurn(sessionId, history, userMessage) {
  history.push({ role: "user", content: userMessage });

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(),
      thinking: { type: "adaptive" },
      output_config: { effort: "low" }, // snappy replies for a chat widget
      tools: [saveLeadTool],
      messages: history,
    });

    if (response.stop_reason === "refusal") {
      return "I'm sorry, I can't help with that. Is there anything about our services I can answer?";
    }

    history.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return text || "…";
    }

    // Execute every tool call and return all results in a single user message
    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      let result;
      try {
        if (block.name === "save_lead") {
          const { score, tier } = scoreLead(block.input);
          const record = saveLead({ session_id: sessionId, ...block.input, score, tier });
          dispatchWebhook(record); // fire-and-forget
          console.log(`Lead saved [${tier} ${score}] ${record.name} <${record.email}>`);
          result = { content: `Lead saved (score ${score}, tier ${tier}). Continue the conversation naturally.` };
        } else {
          result = { content: `Unknown tool: ${block.name}`, is_error: true };
        }
      } catch (err) {
        result = { content: `Tool error: ${err.message}`, is_error: true };
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, ...result });
    }
    history.push({ role: "user", content: toolResults });
  }
}
