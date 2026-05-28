import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";

const DURATIONS: Record<string, number> = {
  "60s":  60_000,
  "5m":   5 * 60_000,
  "10m":  10 * 60_000,
  "30m":  30 * 60_000,
  "1h":   60 * 60_000,
  "6h":   6 * 60 * 60_000,
  "12h":  12 * 60 * 60_000,
  "24h":  24 * 60 * 60_000,
  "7d":   7 * 24 * 60 * 60_000,
};

export const timeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout (mute) a member for a set duration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Member to timeout").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("duration")
        .setDescription("Timeout duration")
        .setRequired(true)
        .addChoices(
          { name: "60 seconds", value: "60s" },
          { name: "5 minutes", value: "5m" },
          { name: "10 minutes", value: "10m" },
          { name: "30 minutes", value: "30m" },
          { name: "1 hour", value: "1h" },
          { name: "6 hours", value: "6h" },
          { name: "12 hours", value: "12h" },
          { name: "24 hours", value: "24h" },
          { name: "7 days", value: "7d" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for timeout").setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const durationKey = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const ms = DURATIONS[durationKey]!;

    const member = interaction.guild?.members.cache.get(target.id)
      ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: "❌ That user is not in this server.", ephemeral: true });
      return;
    }
    if (!member.moderatable) {
      await interaction.reply({ content: "❌ I cannot timeout that user (they may have a higher role).", ephemeral: true });
      return;
    }

    await member.timeout(ms, reason);

    const until = Math.floor((Date.now() + ms) / 1000);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("⏱️ Member Timed Out")
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Duration", value: durationKey, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Expires", value: `<t:${until}:R>` },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
