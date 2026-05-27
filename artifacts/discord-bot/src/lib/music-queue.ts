import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import playdl from "play-dl";

export interface Track {
  url: string;
  title: string;
  duration: string;
  thumbnail: string;
  requestedBy: string;
}

export interface GuildQueue {
  tracks: Track[];
  current: Track | null;
  player: AudioPlayer;
  connection: VoiceConnection;
  isPaused: boolean;
}

const queues = new Map<string, GuildQueue>();

export function getQueue(guildId: string): GuildQueue | undefined {
  return queues.get(guildId);
}

export function createQueue(guildId: string, connection: VoiceConnection): GuildQueue {
  const player = createAudioPlayer();
  const queue: GuildQueue = {
    tracks: [],
    current: null,
    player,
    connection,
    isPaused: false,
  };
  queues.set(guildId, queue);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    playNext(guildId);
  });

  return queue;
}

export function destroyQueue(guildId: string): void {
  const queue = queues.get(guildId);
  if (queue) {
    queue.player.stop(true);
    queue.connection.destroy();
    queues.delete(guildId);
  }
}

export async function playNext(guildId: string): Promise<void> {
  const queue = queues.get(guildId);
  if (!queue) return;

  const next = queue.tracks.shift();
  if (!next) {
    queue.current = null;
    setTimeout(() => {
      const q = queues.get(guildId);
      if (q && !q.current && q.tracks.length === 0) destroyQueue(guildId);
    }, 30_000);
    return;
  }

  queue.current = next;
  try {
    const stream = await playdl.stream(next.url, { quality: 2 });
    const resource: AudioResource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });
    queue.player.play(resource);
    await entersState(queue.player, AudioPlayerStatus.Playing, 5_000);
  } catch {
    playNext(guildId);
  }
}

export async function fetchTrackInfo(query: string): Promise<Track | null> {
  try {
    let url = query;
    if (!query.startsWith("http")) {
      const results = await playdl.search(query, { source: { youtube: "video" }, limit: 1 });
      if (!results.length) return null;
      url = results[0].url;
    }
    const info = await playdl.video_info(url);
    const details = info.video_details;
    return {
      url: details.url,
      title: details.title ?? "Unknown",
      duration: details.durationRaw ?? "0:00",
      thumbnail: details.thumbnails?.[0]?.url ?? "",
      requestedBy: "",
    };
  } catch {
    return null;
  }
}
