import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { fetchGif } from "../../lib/giphy.js";

export const giphyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("giphy")
    .setDescription("Search Giphy for a GIF")
    .addStringOption((opt) => opt.setName("search").setDescription("Search term").setRequired(true)),
  category: "GIFs & Video",
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const query = interaction.options.getString("search", true);
    const url = await fetchGif(query);
    if (!url) {
      await interaction.editReply("❌ No GIF found. Add `GIPHY_API_KEY` to secrets to enable Giphy search.");
      return;
    }
    const embed = new EmbedBuilder().setTitle(`🎭 Giphy: ${query}`).setImage(url).setColor(0x00ff99);
    await interaction.editReply({ embeds: [embed] });
  },
};
