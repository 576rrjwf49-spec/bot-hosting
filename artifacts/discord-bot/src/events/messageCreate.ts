import type { Message, Client, TextChannel } from "discord.js";
import { addXp } from "../lib/xp.js";
import { db } from "../lib/db.js";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function onMessageCreate(message: Message, client: Client): Promise<void> {
  if (message.author.bot || !message.guildId) return;

  // Award XP
  const result = await addXp(message.author.id, message.guildId).catch(() => null);
  if (result?.leveled) {
    await message.channel
      .send(`🎉 Congrats ${message.author}, you reached **Level ${result.newLevel}**!`)
      .catch(() => null);
  }
}

export async function onGuildMemberAdd(member: { guild: { id: string }; toString(): string }, client: Client): Promise<void> {
  const settings = await db.query.guildSettingsTable
    .findFirst({ where: eq(guildSettingsTable.guildId, member.guild.id) })
    .catch(() => null);

  if (!settings?.welcomeChannel || !settings.welcomeMessage) return;

  const channel = client.channels.cache.get(settings.welcomeChannel) as TextChannel | undefined;
  if (!channel) return;

  const msg = settings.welcomeMessage.replace("{user}", member.toString());
  await channel.send(msg).catch(() => null);
}
