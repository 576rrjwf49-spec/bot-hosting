import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";

export const kickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Member to kick").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for kick").setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const member = interaction.guild?.members.cache.get(target.id)
      ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: "❌ That user is not in this server.", ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({ content: "❌ I don't have permission to kick that user (they may have a higher role).", ephemeral: true });
      return;
    }

    // DM before kicking
    try {
      await target.send(`👢 You have been kicked from **${interaction.guild?.name}**.\n**Reason:** ${reason}`);
    } catch { /* DMs disabled */ }

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle("👢 Member Kicked")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
