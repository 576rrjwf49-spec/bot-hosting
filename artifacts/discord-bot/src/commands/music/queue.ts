import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";
import { getQueue } from "../../lib/music-queue.js";

export const queueCommand: Command = {
  data: new SlashCommandBuilder().setName("queue").setDescription("Show the current music queue"),
  category: "Music",
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = getQueue(interaction.guildId!);
    if (!queue?.current && (!queue?.tracks || queue.tracks.length === 0)) {
      await interaction.reply({ content: "📭 The queue is empty.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder().setTitle("🎶 Music Queue").setColor(0x1db954);

    if (queue.current) {
      embed.addFields({ name: "▶️ Now Playing", value: `**${queue.current.title}** (${queue.current.duration})` });
    }

    if (queue.tracks.length > 0) {
      const list = queue.tracks
        .slice(0, 10)
        .map((t, i) => `**${i + 1}.** ${t.title} (${t.duration}) — ${t.requestedBy}`)
        .join("\n");
      embed.addFields({ name: "Up Next", value: list });
      if (queue.tracks.length > 10) {
        embed.setFooter({ text: `…and ${queue.tracks.length - 10} more` });
      }
    } else {
      embed.addFields({ name: "Up Next", value: "Nothing queued." });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
