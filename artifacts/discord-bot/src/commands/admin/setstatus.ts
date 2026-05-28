import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { writeFileSync } from "fs";
import type { Command } from "../index.js";

export const setstatusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("setstatus")
    .setDescription("Set the bot's public status shown on the dashboard (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("status")
        .setDescription("Status to display")
        .setRequired(true)
        .addChoices(
          { name: "🟢 Online",             value: "online"      },
          { name: "🔧 Under Maintenance",  value: "maintenance" }
        )
    ),
  category: "Admin",
  async execute(interaction: ChatInputCommandInteraction) {
    const status = interaction.options.getString("status", true) as "online" | "maintenance";

    try {
      writeFileSync("/tmp/bot-status.json", JSON.stringify({ status }), "utf-8");
    } catch {
      await interaction.reply({ content: "❌ Failed to write status file.", ephemeral: true });
      return;
    }

    const labels: Record<string, string> = {
      online:      "🟢 Online",
      maintenance: "🔧 Under Maintenance",
    };

    const embed = new EmbedBuilder()
      .setColor(status === "maintenance" ? 0xffa500 : 0x57f287)
      .setTitle("✅ Dashboard Status Updated")
      .setDescription(`Bot status is now **${labels[status]}** on the dashboard.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
