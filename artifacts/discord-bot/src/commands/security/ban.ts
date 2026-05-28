import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";

export const banCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Member to ban").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for ban").setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("delete_days")
        .setDescription("Days of message history to delete (0–7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;
    const member = interaction.guild?.members.cache.get(target.id)
      ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      await interaction.reply({ content: "❌ I don't have permission to ban that user (they may have a higher role).", ephemeral: true });
      return;
    }

    // DM before banning
    try {
      await target.send(`🔨 You have been banned from **${interaction.guild?.name}**.\n**Reason:** ${reason}`);
    } catch { /* DMs disabled */ }

    await interaction.guild?.members.ban(target.id, {
      reason,
      deleteMessageSeconds: deleteDays * 86400,
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔨 Member Banned")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Messages Deleted", value: `${deleteDays} day(s)`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
