import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";
import fetch from "node-fetch";

// ── Free AI provider chain ────────────────────────────────────────────────────
// Tried in order; falls through to the next on any error or rate-limit.

// ───────────────── GEMINI ─────────────────

async function tryGemini(question: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }],
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      candidates?: {
        content: { parts: { text: string }[] };
      }[];
    };

    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ───────────────── GROQ ─────────────────

async function tryGroq(question: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: question }],
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: { message: { content: string } }[];
    };

    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ───────────────── OPENROUTER ─────────────────

async function tryOpenRouter(question: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: question }],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: { message: { content: string } }[];
    };

    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ───────────────── TOGETHER AI ─────────────────

async function tryTogether(question: string): Promise<string | null> {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages: [{ role: "user", content: question }],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: { message: { content: string } }[];
    };

    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ───────────────── HUGGINGFACE ─────────────────

async function tryHuggingFace(question: string): Promise<string | null> {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: question,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as any;

    if (Array.isArray(json) && json[0]?.generated_text) {
      return json[0].generated_text;
    }

    return null;
  } catch {
    return null;
  }
}

// ───────────────── DEEPINFRA ─────────────────

async function tryDeepInfra(question: string): Promise<string | null> {
  const key = process.env.DEEPINFRA_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      "https://api.deepinfra.com/v1/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Meta-Llama-3-8B-Instruct",
          messages: [{ role: "user", content: question }],
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      choices?: { message: { content: string } }[];
    };

    return json.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ───────────────── OLLAMA (LOCAL) ─────────────────

async function tryOllama(question: string): Promise<string | null> {
  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt: question,
        stream: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      response?: string;
    };

    return json.response ?? null;
  } catch {
    return null;
  }
}

// ───────────────── POLLINATIONS ─────────────────

async function tryPollinations(question: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(question);

    const res = await fetch(
      `https://text.pollinations.ai/${encoded}?model=openai&seed=42&private=true`,
      {
        signal: AbortSignal.timeout(15_000),
      }
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
      opt
        .setName("question")
        .setDescription("Your question")
        .setRequired(true)
    ),

  category: "AI & Info",

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const question = interaction.options.getString("question", true);

    // Try providers in order
    const answer =
      (await tryGemini(question)) ??
      (await tryGroq(question)) ??
      (await tryOpenRouter(question)) ??
      (await tryTogether(question)) ??
      (await tryDeepInfra(question)) ??
      (await tryHuggingFace(question)) ??
      (await tryOllama(question)) ??
      (await tryPollinations(question));

    if (!answer) {
      await interaction.editReply(
        "❌ All AI providers are currently unavailable. Try again later."
      );
      return;
    }

    // Discord embed limit
    const trimmed =
      answer.length > 3900
        ? answer.slice(0, 3900) + "…"
        : answer;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🤖 ${question}`)
      .setDescription(trimmed)
      .setFooter({ text: "Powered by free AI providers" });

    await interaction.editReply({
      embeds: [embed],
    });
  },
};