import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getQueue } from "../../lib/music-queue.js";

export const nowplayingCommand: Command = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing song"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue?.current) {
      await interaction.reply({ content: "❌ Nothing is playing right now.", ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle("🎵 Now Playing")
      .setDescription(`**[${queue.current.title}](${queue.current.url})**`)
      .addFields(
        { name: "Duration", value: queue.current.duration, inline: true },
        { name: "Requested by", value: queue.current.requestedBy, inline: true },
        { name: "Queue", value: `${queue.tracks.length} song(s) up next`, inline: true }
      )
      .setThumbnail(queue.current.thumbnail)
      .setColor(0x1db954);
    await interaction.reply({ embeds: [embed] });
  },
};
