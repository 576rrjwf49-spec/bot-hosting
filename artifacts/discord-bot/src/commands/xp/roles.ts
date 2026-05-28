import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { LEVEL_ROLES } from "../../lib/xp.js";

export const rolesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Show XP level roles and their requirements"),
  category: "XP System",

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply("❌ This command must be used in a server.");
      return;
    }

    // Fetch fresh role list so cache is up to date
    await guild.roles.fetch();

    const lines = Object.entries(LEVEL_ROLES)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([lvl, name]) => {
        const role = guild.roles.cache.find((r) => r.name === name);
        const roleText = role
          ? `<@&${role.id}>`
          : `\`${name}\` *(not created in server yet)*`;
        return `**Level ${lvl}** → ${roleText}`;
      });

    const missing = Object.values(LEVEL_ROLES).filter(
      (name) => !guild.roles.cache.find((r) => r.name === name)
    );

    const embed = new EmbedBuilder()
      .setTitle("⭐ XP Level Roles")
      .setDescription(lines.join("\n"))
      .setColor(0xffd700)
      .setFooter({
        text:
          missing.length > 0
            ? `⚠️ Create these roles in your server: ${missing.join(", ")}`
            : "All roles are set up ✅",
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
