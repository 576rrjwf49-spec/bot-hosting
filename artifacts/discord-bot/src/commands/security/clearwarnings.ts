import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const clearwarningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings for a user (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to clear warnings for").setRequired(true)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const guildId = interaction.guildId!;

    await db
      .delete(warningsTable)
      .where(and(eq(warningsTable.userId, target.id), eq(warningsTable.guildId, guildId)));

    await interaction.reply(
      `🗑️ Cleared all warnings for **${target.username}**.`
    );
  },
};
