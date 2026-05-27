import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { eq, and } from "drizzle-orm";
import { db } from "../../lib/db.js";
import { xpTable } from "@workspace/db";
import { levelFromXp } from "../../lib/xp.js";

export const givexpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("givexp")
    .setDescription("Give XP to a user (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("XP amount").setRequired(true).setMinValue(1)),
  category: "Admin",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const guildId = interaction.guildId!;

    const existing = await db.query.xpTable.findFirst({
      where: and(eq(xpTable.userId, target.id), eq(xpTable.guildId, guildId)),
    });

    const newXp = (existing?.xp ?? 0) + amount;
    const newLevel = levelFromXp(newXp);

    if (existing) {
      await db.update(xpTable).set({ xp: newXp, level: newLevel }).where(and(eq(xpTable.userId, target.id), eq(xpTable.guildId, guildId)));
    } else {
      await db.insert(xpTable).values({ userId: target.id, guildId, xp: newXp, level: newLevel });
    }

    await interaction.reply(`✅ Gave **${amount} XP** to ${target.username}. They are now Level ${newLevel} (${newXp} XP).`);
  },
};
