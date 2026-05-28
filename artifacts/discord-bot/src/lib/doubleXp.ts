import { EmbedBuilder, type Client, type TextChannel } from "discord.js";
import { db } from "./db.js";
import { guildSettingsTable } from "@workspace/db";

// ── In-process double XP state ────────────────────────────────────────────────
let endTime: number | null = null;

export function isDoubleXpActive(): boolean {
  if (endTime === null) return false;
  if (Date.now() >= endTime) {
    endTime = null;
    return false;
  }
  return true;
}

export function getDoubleXpEnd(): Date | null {
  if (!isDoubleXpActive()) return null;
  return new Date(endTime!);
}

export function activateDoubleXp(durationMs: number): void {
  endTime = Date.now() + durationMs;
}

export function deactivateDoubleXp(): void {
  endTime = null;
}

// ── Broadcast to every guild's announce channel ───────────────────────────────
export async function announceDoubleXp(
  client: Client,
  started: boolean,
  durationMin?: number
): Promise<void> {
  try {
    const allSettings = await db.select().from(guildSettingsTable);

    for (const settings of allSettings) {
      if (!settings.announceChannel) continue;
      const channel = client.channels.cache.get(settings.announceChannel) as
        | TextChannel
        | undefined;
      if (!channel) continue;

      const embed = started
        ? new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("⚡ Double XP Event Started!")
            .setDescription(
              `**Double XP is now LIVE for ${durationMin ?? 30} minutes!**\n\n` +
                `Every message you send earns **2× XP** during this event.\n` +
                `Get chatting and level up fast! 🚀`
            )
            .setFooter({ text: "An announcement will be made when it ends" })
            .setTimestamp()
        : new EmbedBuilder()
            .setColor(0x99aab5)
            .setTitle("⏰ Double XP Event Ended")
            .setDescription(
              "The Double XP event has ended. Thanks for participating!\n\nNormal XP rates are back in effect."
            )
            .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  } catch { /* ignore broadcast errors */ }
}
