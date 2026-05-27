import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getQueue } from "../../lib/music-queue.js";

export const resumeCommand: Command = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume the paused song"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue?.isPaused) {
      await interaction.reply({ content: "❌ Nothing is paused.", ephemeral: true });
      return;
    }
    queue.player.unpause();
    queue.isPaused = false;
    await interaction.reply(`▶️ Resumed **${queue.current?.title ?? "the song"}**.`);
  },
};
