import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { fetchLyrics } from "../../lib/giphy.js";

export const lyricsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Get lyrics for a song")
    .addStringOption((opt) =>
      opt.setName("song").setDescription("Song name (e.g. Artist - Title)").setRequired(true)
    ),
  category: "AI & Info",
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const song = interaction.options.getString("song", true);
    const result = await fetchLyrics(song);
    if (!result) {
      await interaction.editReply("❌ Could not find lyrics for that song.");
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎤 ${result.title}`)
      .setDescription(result.lyrics)
      .setColor(0x9b59b6);
    await interaction.editReply({ embeds: [embed] });
  },
};
