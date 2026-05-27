import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction, type Client } from "discord.js";
import type { Command } from "../index.js";

export const statusCommand: Command = {
  data: new SlashCommandBuilder().setName("status").setDescription("Show bot status and stats"),
  category: "AI & Info",
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;

    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Status")
      .addFields(
        { name: "Uptime", value: `${h}h ${m}m ${s}s`, inline: true },
        { name: "Memory", value: `${mem.toFixed(1)} MB`, inline: true },
        { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
        { name: "Servers", value: `${client.guilds.cache.size}`, inline: true }
      )
      .setColor(0x57f287)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
