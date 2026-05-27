import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const watchCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Share a YouTube video link to watch together")
    .addStringOption((opt) => opt.setName("url").setDescription("YouTube video URL").setRequired(true)),
  category: "GIFs & Video",
  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString("url", true);
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      await interaction.reply({ content: "❌ Please provide a valid YouTube URL.", ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle("📺 Watch Together")
      .setDescription(`${interaction.user.username} wants to watch:\n${url}`)
      .setColor(0xff0000);
    await interaction.reply({ embeds: [embed] });
  },
};
