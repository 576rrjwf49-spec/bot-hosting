import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { Command } from "../index.js";

export const slowmodeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode on the current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) =>
      opt
        .setName("seconds")
        .setDescription("Slowmode delay in seconds (0 to disable, max 21600)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger("seconds", true);
    const channel = interaction.channel as TextChannel;

    await channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      await interaction.reply(`✅ Slowmode **disabled** in ${channel}.`);
    } else {
      const display =
        seconds < 60
          ? `${seconds}s`
          : seconds < 3600
          ? `${Math.round(seconds / 60)}m`
          : `${Math.round(seconds / 3600)}h`;
      await interaction.reply(`🐢 Slowmode set to **${display}** in ${channel}.`);
    }
  },
};
