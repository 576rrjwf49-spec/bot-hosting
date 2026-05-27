import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { fetchGif } from "../../lib/giphy.js";

export const gifCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("gif")
    .setDescription("Search for a GIF")
    .addStringOption((opt) => opt.setName("search").setDescription("What to search for").setRequired(true)),
  category: "GIFs & Video",
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const query = interaction.options.getString("search", true);
    const url = await fetchGif(query);
    if (!url) {
      await interaction.editReply("❌ No GIF found. Set `GIPHY_API_KEY` or `TENOR_API_KEY` in secrets for full results.");
      return;
    }
    const embed = new EmbedBuilder().setTitle(`🖼️ ${query}`).setImage(url).setColor(0xff6b6b);
    await interaction.editReply({ embeds: [embed] });
  },
};
