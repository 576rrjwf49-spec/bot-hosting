import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getUserXp, xpForLevel } from "../../lib/xp.js";

export const levelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Check your XP level")
    .addUserOption((opt) => opt.setName("user").setDescription("User to check (default: yourself)").setRequired(false)),
  category: "XP System",
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const row = await getUserXp(target.id, interaction.guildId!);
    const xp = row?.xp ?? 0;
    const level = row?.level ?? 0;
    const xpNeeded = xpForLevel(level);

    const embed = new EmbedBuilder()
      .setTitle(`⭐ ${target.username}'s Level`)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "XP", value: `${xp}`, inline: true },
        { name: "Next Level", value: `${xpNeeded} XP needed`, inline: true }
      )
      .setThumbnail(target.displayAvatarURL())
      .setColor(0xffd700);
    await interaction.reply({ embeds: [embed] });
  },
};
