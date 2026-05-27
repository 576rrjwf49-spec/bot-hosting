import { SlashCommandBuilder, type ChatInputCommandInteraction, type Client } from "discord.js";
import type { Command } from "../index.js";
import { getQueue, playNext } from "../../lib/music-queue.js";

export const skipCommand: Command = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue?.current) {
      await interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
      return;
    }
    const skipped = queue.current.title;
    queue.player.stop();
    await interaction.reply(`⏭️ Skipped **${skipped}**.`);
  },
};
