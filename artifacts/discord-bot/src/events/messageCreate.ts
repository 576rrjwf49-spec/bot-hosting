import type { Message, Client, TextChannel, GuildMember } from "discord.js";
import { addXp, LEVEL_ROLES } from "../lib/xp.js";
import { db } from "../lib/db.js";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function assignLevelRoles(member: GuildMember, newLevel: number): Promise<void> {
  // Award every role the member has earned up to their current level
  const rolesToGive = Object.entries(LEVEL_ROLES)
    .filter(([lvl]) => newLevel >= Number(lvl))
    .map(([, name]) => name);

  for (const roleName of rolesToGive) {
    const role = member.guild.roles.cache.find((r) => r.name === roleName);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role, `Reached level ${newLevel}`).catch(() => null);
    }
  }
}

export async function onMessageCreate(message: Message, client: Client): Promise<void> {
  if (message.author.bot || !message.guildId) return;

  const result = await addXp(message.author.id, message.guildId).catch(() => null);
  if (!result?.leveled) return;

  // Announce level-up
  await message.channel
    .send(`🎉 Congrats ${message.author}, you reached **Level ${result.newLevel}**!`)
    .catch(() => null);

  // Assign any earned roles
  if (message.member) {
    await assignLevelRoles(message.member, result.newLevel);
  }
}

export async function onGuildMemberAdd(
  member: { guild: { id: string }; toString(): string },
  client: Client
): Promise<void> {
  const settings = await db.query.guildSettingsTable
    .findFirst({ where: eq(guildSettingsTable.guildId, member.guild.id) })
    .catch(() => null);

  if (!settings?.welcomeChannel || !settings.welcomeMessage) return;

  const channel = client.channels.cache.get(settings.welcomeChannel) as TextChannel | undefined;
  if (!channel) return;

  const msg = settings.welcomeMessage.replace("{user}", member.toString());
  await channel.send(msg).catch(() => null);
}
