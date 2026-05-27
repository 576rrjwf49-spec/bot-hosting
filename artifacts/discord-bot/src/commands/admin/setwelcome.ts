import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const setwelcomeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Set the welcome message channel and message (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) => opt.setName("channel").setDescription("Welcome channel").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Welcome message (use {user} for mention)").setRequired(false)
    ),
  category: "Admin",
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true);
    const message = interaction.options.getString("message") ?? "Welcome to the server, {user}! 🎉";
    const guildId = interaction.guildId!;

    await db
      .insert(guildSettingsTable)
      .values({ guildId, welcomeChannel: channel.id, welcomeMessage: message })
      .onConflictDoUpdate({
        target: guildSettingsTable.guildId,
        set: { welcomeChannel: channel.id, welcomeMessage: message },
      });

    await interaction.reply(`✅ Welcome messages will be sent to <#${channel.id}> with message:\n> ${message}`);
  },
};
