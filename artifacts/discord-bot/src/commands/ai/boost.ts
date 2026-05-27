import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const boostCommand: Command = {
  data: new SlashCommandBuilder().setName("boost").setDescription("Show server boost information"),
  category: "AI & Info",
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const embed = new EmbedBuilder()
      .setTitle("🚀 Server Boost Info")
      .addFields(
        { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
        { name: "Total Boosts", value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true }
      )
      .setColor(0xff73fa)
      .setThumbnail(guild.iconURL());
    await interaction.reply({ embeds: [embed] });
  },
};
