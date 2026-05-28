import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";

export const unbanCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by their Discord ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) =>
      opt
        .setName("user_id")
        .setDescription("Discord user ID to unban")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for unban").setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("user_id", true).trim();
    const reason = interaction.options.getString("reason") ?? "No reason provided";

    if (!/^\d{17,20}$/.test(userId)) {
      await interaction.reply({ content: "❌ Invalid user ID — Discord IDs are 17–20 digits.", ephemeral: true });
      return;
    }

    try {
      const ban = await interaction.guild?.bans.fetch(userId);
      if (!ban) {
        await interaction.reply({ content: "❌ That user is not banned.", ephemeral: true });
        return;
      }

      await interaction.guild?.members.unban(userId, reason);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("✅ User Unbanned")
        .addFields(
          { name: "User", value: `${ban.user.tag} (${userId})`, inline: true },
          { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ That user is not banned.", ephemeral: true });
    }
  },
};
