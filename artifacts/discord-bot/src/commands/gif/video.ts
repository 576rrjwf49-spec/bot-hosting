import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const videoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("video")
    .setDescription("Search YouTube for a video")
    .addStringOption((opt) => opt.setName("query").setDescription("Search term").setRequired(true)),
  category: "GIFs & Video",
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString("query", true);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const embed = new EmbedBuilder()
      .setTitle(`🎬 YouTube Search: ${query}`)
      .setDescription(`[Click here to view results](${searchUrl})`)
      .setColor(0xff0000);
    await interaction.reply({ embeds: [embed] });
  },
};
