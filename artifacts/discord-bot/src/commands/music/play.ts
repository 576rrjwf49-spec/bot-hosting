import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction, type Client } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import type { Command } from "../index.js";
import { getQueue, createQueue, playNext, fetchTrackInfo } from "../../lib/music-queue.js";
import type { GuildMember } from "discord.js";

export const playCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("Song name or YouTube URL").setRequired(true)
    ),
  category: "Music",

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      await interaction.editReply("❌ You need to be in a voice channel first.");
      return;
    }

    const query = interaction.options.getString("query", true);
    const track = await fetchTrackInfo(query);
    if (!track) {
      await interaction.editReply("❌ Could not find that song.");
      return;
    }
    track.requestedBy = interaction.user.username;

    let queue = getQueue(interaction.guildId!);
    if (!queue) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator as any,
      });
      queue = createQueue(interaction.guildId!, connection);
    }

    queue.tracks.push(track);

    const embed = new EmbedBuilder()
      .setTitle("🎵 Added to Queue")
      .setDescription(`**[${track.title}](${track.url})**`)
      .addFields(
        { name: "Duration", value: track.duration, inline: true },
        { name: "Requested by", value: track.requestedBy, inline: true },
        { name: "Position", value: queue.current ? `#${queue.tracks.length}` : "Next", inline: true }
      )
      .setThumbnail(track.thumbnail)
      .setColor(0x1db954);

    await interaction.editReply({ embeds: [embed] });

    if (!queue.current) playNext(interaction.guildId!);
  },
};
