import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Client,
} from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { xpTable, warningsTable, guildSettingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

export const dashboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("View the private admin dashboard (only you can see this)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: "Admin",

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild!;
    const guildId = guild.id;

    // Fetch all data in parallel
    const [members, settings, topXp, totalWarnings] = await Promise.all([
      guild.members.fetch().catch(() => guild.memberCount),
      db.query.guildSettingsTable
        .findFirst({ where: eq(guildSettingsTable.guildId, guildId) })
        .catch(() => null),
      db
        .select()
        .from(xpTable)
        .where(eq(xpTable.guildId, guildId))
        .orderBy(desc(xpTable.xp))
        .limit(5)
        .catch(() => []),
      db
        .select()
        .from(warningsTable)
        .where(eq(warningsTable.guildId, guildId))
        .catch(() => []),
    ]);

    const memberCount =
      typeof members === "number" ? members : members.size;
    const botCount =
      typeof members === "number"
        ? "?"
        : members.filter((m) => m.user.bot).size;

    // Bot uptime
    const uptimeSecs = Math.floor((client.uptime ?? 0) / 1000);
    const uptimeH = Math.floor(uptimeSecs / 3600);
    const uptimeM = Math.floor((uptimeSecs % 3600) / 60);
    const uptimeStr = uptimeSecs < 60
      ? `${uptimeSecs}s`
      : uptimeH > 0
      ? `${uptimeH}h ${uptimeM}m`
      : `${uptimeM}m`;

    // Next restart countdown
    const nextRestart = getNextRestart();
    const minsLeft = Math.floor((nextRestart.getTime() - Date.now()) / 60_000);
    const restartStr =
      minsLeft >= 60
        ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`
        : `${minsLeft}m`;

    // Top XP
    const topLines =
      topXp.length === 0
        ? "No XP data yet"
        : topXp
            .map(
              (r, i) =>
                `${["🥇", "🥈", "🥉", "4.", "5."][i]} <@${r.userId}> — Lv${r.level} (${r.xp} XP)`
            )
            .join("\n");

    // Settings
    const welcomeLine = settings?.welcomeChannel
      ? `<#${settings.welcomeChannel}>`
      : "Not set";
    const announceLine = settings?.announceChannel
      ? `<#${settings.announceChannel}>`
      : "Not set";
    const welcomeMsg = settings?.welcomeMessage
      ? `\`${settings.welcomeMessage.slice(0, 40)}${settings.welcomeMessage.length > 40 ? "…" : ""}\``
      : "Not set";

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⚙️ Admin Dashboard")
      .setDescription(
        `**${guild.name}** · <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .addFields(
        {
          name: "🤖 Bot",
          value: [
            `**Status:** 🟢 Online`,
            `**Uptime:** ${uptimeStr}`,
            `**Servers:** ${client.guilds.cache.size}`,
            `**Next restart:** ${restartStr}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🌐 Server",
          value: [
            `**Members:** ${memberCount}`,
            `**Bots:** ${botCount}`,
            `**Channels:** ${guild.channels.cache.size}`,
            `**Roles:** ${guild.roles.cache.size}`,
          ].join("\n"),
          inline: true,
        },
        { name: "\u200b", value: "\u200b", inline: true }, // spacer
        {
          name: "⚙️ Settings",
          value: [
            `**Welcome channel:** ${welcomeLine}`,
            `**Welcome message:** ${welcomeMsg}`,
            `**Announce channel:** ${announceLine}`,
          ].join("\n"),
        },
        {
          name: `⭐ Top XP — ${guild.name}`,
          value: topLines,
        },
        {
          name: "⚠️ Warnings",
          value: `**${totalWarnings.length}** active warning${totalWarnings.length === 1 ? "" : "s"} on record`,
          inline: true,
        },
        {
          name: "📋 Commands",
          value: `**${client.application?.commands.cache.size ?? "?"}** registered`,
          inline: true,
        },
      )
      .setThumbnail(guild.iconURL() ?? null)
      .setFooter({ text: "Only visible to you · Scary Juan Admin Dashboard" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

function getNextRestart(): Date {
  const START_HOUR_UTC = 3;
  const now = new Date();
  const candidate = new Date(now);
  candidate.setUTCMinutes(0, 0, 0);
  candidate.setUTCHours(candidate.getUTCHours() + 1);
  if (candidate.getUTCHours() < START_HOUR_UTC) {
    candidate.setUTCHours(START_HOUR_UTC, 0, 0, 0);
  }
  if (candidate <= now) {
    candidate.setUTCHours(candidate.getUTCHours() + 1, 0, 0, 0);
  }
  return candidate;
}
