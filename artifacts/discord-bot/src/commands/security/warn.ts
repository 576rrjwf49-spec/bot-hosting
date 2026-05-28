import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user (stored in the database)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to warn").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const guildId = interaction.guildId!;
    const moderator = interaction.user;

    if (target.id === moderator.id) {
      await interaction.reply({ content: "❌ You cannot warn yourself.", ephemeral: true });
      return;
    }
    if (target.bot) {
      await interaction.reply({ content: "❌ You cannot warn bots.", ephemeral: true });
      return;
    }

    await db.insert(warningsTable).values({
      userId: target.id,
      guildId,
      reason,
      warnedBy: moderator.id,
    });

    const count = await db
      .select()
      .from(warningsTable)
      .where(and(eq(warningsTable.userId, target.id), eq(warningsTable.guildId, guildId)));

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⚠️ Warning Issued")
      .addFields(
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
        { name: "Total Warnings", value: String(count.length), inline: true },
        { name: "Reason", value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Try to DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("⚠️ You have been warned")
        .addFields(
          { name: "Server", value: interaction.guild?.name ?? "Unknown", inline: true },
          { name: "Warnings", value: String(count.length), inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp();
      await target.send({ embeds: [dmEmbed] });
    } catch { /* DMs disabled, ignore */ }
  },
};
