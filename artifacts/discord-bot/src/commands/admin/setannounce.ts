import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { guildSettingsTable } from "@workspace/db";

export const setannounceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("setannounce")
    .setDescription("Set the announcements channel (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) => opt.setName("channel").setDescription("Announcements channel").setRequired(true)),
  category: "Admin",
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true);
    const guildId = interaction.guildId!;

    await db
      .insert(guildSettingsTable)
      .values({ guildId, announceChannel: channel.id })
      .onConflictDoUpdate({
        target: guildSettingsTable.guildId,
        set: { announceChannel: channel.id },
      });

    await interaction.reply(`✅ Announcements channel set to <#${channel.id}>. New command updates will be posted there.`);
  },
};
