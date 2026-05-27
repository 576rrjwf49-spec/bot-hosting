import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

const LEVEL_ROLES: Record<number, string> = {
  5:  "Level 5",
  10: "Level 10",
  20: "Level 20",
  50: "Level 50",
};

export const rolesCommand: Command = {
  data: new SlashCommandBuilder().setName("roles").setDescription("Show XP level roles and their requirements"),
  category: "XP System",
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("⭐ XP Level Roles")
      .setDescription(
        Object.entries(LEVEL_ROLES)
          .map(([lvl, name]) => `**Level ${lvl}** — @${name}`)
          .join("\n")
      )
      .setColor(0xffd700)
      .setFooter({ text: "Earn XP by chatting in the server" });
    await interaction.reply({ embeds: [embed] });
  },
};
