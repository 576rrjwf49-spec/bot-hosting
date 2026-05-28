import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../index.js";
import { db } from "../../lib/db.js";
import { warningsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

export const warningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings for a user")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("User to check").setRequired(true)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const guildId = interaction.guildId!;

    const rows = await db
      .select()
      .from(warningsTable)
      .where(and(eq(warningsTable.userId, target.id), eq(warningsTable.guildId, guildId)))
      .orderBy(asc(warningsTable.createdAt));

    if (!rows.length) {
      await interaction.reply(`✅ **${target.username}** has no warnings.`);
      return;
    }

    const lines = rows.map(
      (w, i) =>
        `**${i + 1}.** ${w.reason}\n> By <@${w.warnedBy}> • <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`
    );

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`⚠️ Warnings for ${target.username}`)
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: `${rows.length} warning${rows.length === 1 ? "" : "s"} total` })
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
