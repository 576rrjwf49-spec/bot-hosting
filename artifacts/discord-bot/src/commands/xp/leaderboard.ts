import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getLeaderboard } from "../../lib/xp.js";

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder().setName("leaderboard").setDescription("Show the top 10 XP leaderboard"),
  category: "XP System",
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const rows = await getLeaderboard(interaction.guildId!);
    if (!rows.length) {
      await interaction.editReply("No XP data yet — start chatting to earn XP!");
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = rows.map((r, i) => {
      const medal = medals[i] ?? `**${i + 1}.**`;
      return `${medal} <@${r.userId}> — Level ${r.level} (${r.xp} XP)`;
    });

    const embed = new EmbedBuilder()
      .setTitle("🏆 XP Leaderboard")
      .setDescription(lines.join("\n"))
      .setColor(0xffd700)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
