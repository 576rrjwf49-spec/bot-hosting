import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, type ChatInputCommandInteraction, type Client, TextChannel } from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { allCommands } from "../index.js";

const CATEGORY_ICONS: Record<string, string> = {
  "Music":        "🎵",
  "GIFs & Video": "🖼️",
  "AI & Info":    "🤖",
  "Games":        "🎮",
  "XP System":    "⭐",
  "Admin":        "🔧",
  "General":      "📋",
};

export const setcommandsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("setcommands")
    .setDescription("Post the full command list to the announcements channel (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  category: "Admin",
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const guildId = interaction.guildId!;
    const settings = await db.query.guildSettingsTable.findFirst({
      where: eq(guildSettingsTable.guildId, guildId),
    });

    const targetChannelId = settings?.announceChannel ?? interaction.channelId;
    const channel = client.channels.cache.get(targetChannelId) as TextChannel | undefined;

    if (!channel) {
      await interaction.reply({ content: "❌ Announcements channel not found. Use `/setannounce` first.", ephemeral: true });
      return;
    }

    const grouped = new Map<string, Command[]>();
    for (const cmd of allCommands) {
      const list = grouped.get(cmd.category) ?? [];
      list.push(cmd);
      grouped.set(cmd.category, list);
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 Bot Commands")
      .setDescription("Here's everything this bot can do:")
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: `${allCommands.length} commands • Use /help for details` });

    for (const [category, cmds] of grouped) {
      const icon = CATEGORY_ICONS[category] ?? "📋";
      embed.addFields({
        name: `${icon} ${category}`,
        value: cmds.map((c) => `\`/${c.data.name}\``).join("  "),
      });
    }

    await channel.send({ embeds: [embed] });
    await interaction.reply(`✅ Command list posted to <#${targetChannelId}>.`);
  },
};
