import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getQueue, destroyQueue } from "../../lib/music-queue.js";

export const stopCommand: Command = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop music and leave the voice channel"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue) {
      await interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
      return;
    }
    destroyQueue(interaction.guildId!);
    await interaction.reply("⏹️ Stopped and left the voice channel.");
  },
};
