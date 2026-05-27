import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import fetch from "node-fetch";

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI a question")
    .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true)),
  category: "AI & Info",
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const question = interaction.options.getString("question", true);

    const apiKey = process.env.OPENAI_API_KEY ?? process.env.REPLIT_AI_KEY;
    if (!apiKey) {
      await interaction.editReply("❌ No AI API key configured. Add `OPENAI_API_KEY` to secrets.");
      return;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }],
          max_tokens: 500,
        }),
      });
      const json = (await res.json()) as { choices?: { message: { content: string } }[] };
      const answer = json.choices?.[0]?.message?.content ?? "No response.";
      await interaction.editReply(`🤖 **${question}**\n\n${answer}`);
    } catch {
      await interaction.editReply("❌ Failed to get a response from the AI.");
    }
  },
};
