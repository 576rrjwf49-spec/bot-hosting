import { eq, and, desc } from "drizzle-orm";
import { db } from "./db.js";
import { xpTable } from "@workspace/db";

export const XP_PER_MESSAGE = 15;
export const XP_COOLDOWN_MS = 60_000;
const cooldowns = new Map<string, number>();

export function xpForLevel(level: number): number {
  return 5 * level * level + 50 * level + 100;
}

export function levelFromXp(xp: number): number {
  let level = 0;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

export async function addXp(userId: string, guildId: string): Promise<{ leveled: boolean; newLevel: number } | null> {
  const key = `${userId}:${guildId}`;
  const now = Date.now();
  if ((cooldowns.get(key) ?? 0) + XP_COOLDOWN_MS > now) return null;
  cooldowns.set(key, now);

  const existing = await db.query.xpTable.findFirst({
    where: and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)),
  });

  const currentXp = (existing?.xp ?? 0) + XP_PER_MESSAGE;
  const newLevel = levelFromXp(currentXp);
  const leveled = newLevel > (existing?.level ?? 0);

  if (existing) {
    await db.update(xpTable)
      .set({ xp: currentXp, level: newLevel, lastMessageAt: new Date() })
      .where(and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)));
  } else {
    await db.insert(xpTable).values({ userId, guildId, xp: currentXp, level: newLevel, lastMessageAt: new Date() });
  }

  return { leveled, newLevel };
}

export async function getUserXp(userId: string, guildId: string) {
  return db.query.xpTable.findFirst({
    where: and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)),
  });
}

export async function getLeaderboard(guildId: string, limit = 10) {
  return db.select().from(xpTable).where(eq(xpTable.guildId, guildId)).orderBy(desc(xpTable.xp)).limit(limit);
}
