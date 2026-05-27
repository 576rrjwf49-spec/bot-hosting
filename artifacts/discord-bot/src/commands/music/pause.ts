import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getQueue } from "../../lib/music-queue.js";
import { AudioPlayerStatus } from "@discordjs/voice";

export const pauseCommand: Command = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current song"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue?.current) {
      await interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
      return;
    }
    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      await interaction.reply({ content: "⏸️ Already paused. Use `/resume` to continue.", ephemeral: true });
      return;
    }
    queue.player.pause();
    queue.isPaused = true;
    await interaction.reply(`⏸️ Paused **${queue.current.title}**.`);
  },
};
