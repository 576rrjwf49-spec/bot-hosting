import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export const userinfoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View detailed info about a user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to look up (defaults to yourself)").setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const guildId = interaction.guildId!;

    const member = interaction.guild?.members.cache.get(target.id)
      ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

    const warnings = await db
      .select()
      .from(warningsTable)
      .where(and(eq(warningsTable.userId, target.id), eq(warningsTable.guildId, guildId)));

    const createdAt = Math.floor(target.createdTimestamp / 1000);
    const joinedAt = member?.joinedTimestamp
      ? Math.floor(member.joinedTimestamp / 1000)
      : null;

    const roles = member?.roles.cache
      .filter((r) => r.id !== interaction.guild?.roles.everyone.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}>`)
      .slice(0, 10)
      ?? [];

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || 0x5865f2)
      .setTitle(`👤 ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "User ID", value: target.id, inline: true },
        { name: "Bot", value: target.bot ? "Yes" : "No", inline: true },
        { name: "Warnings", value: String(warnings.length), inline: true },
        { name: "Account Created", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)` },
      );

    if (joinedAt) {
      embed.addFields({ name: "Joined Server", value: `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` });
    }

    if (member?.nickname) {
      embed.addFields({ name: "Nickname", value: member.nickname, inline: true });
    }

    if (roles.length) {
      embed.addFields({
        name: `Roles (${member?.roles.cache.size ? member.roles.cache.size - 1 : 0})`,
        value: roles.join(" ") || "None",
      });
    }

    embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
