import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import fetch from "node-fetch";

// ── Free AI provider chain ────────────────────────────────────────────────────
// Tried in order; falls through to the next on any error or rate-limit.
// All providers are free. No paid keys required.

async function tryGemini(question: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: { content: { parts: { text: string }[] } }[];
    };
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

async function tryGroq(question: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: question }],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message: { content: string } }[] };
    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function tryPollinations(question: string): Promise<string | null> {
  // Pollinations.ai — completely free, no API key needed
  try {
    const encoded = encodeURIComponent(question);
    const res = await fetch(
      `https://text.pollinations.ai/${encoded}?model=openai&seed=42&private=true`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI a question")
    .addStringOption((opt) =>
      opt.setName("question").setDescription("Your question").setRequired(true)
    ),
  category: "AI & Info",

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const question = interaction.options.getString("question", true);

    // Try each free provider in order, fall through on failure
    const answer =
      (await tryGemini(question)) ??
      (await tryGroq(question)) ??
      (await tryPollinations(question));

    if (!answer) {
      await interaction.editReply(
        "❌ All AI providers are currently unavailable. Try again in a moment."
      );
      return;
    }

    // Trim to Discord's 4096-char embed limit
    const trimmed = answer.length > 3900 ? answer.slice(0, 3900) + "…" : answer;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🤖 ${question}`)
      .setDescription(trimmed)
      .setFooter({ text: "Powered by free AI" });

    await interaction.editReply({ embeds: [embed] });
  },
};
