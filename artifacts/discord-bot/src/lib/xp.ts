import { eq, and, desc } from "drizzle-orm";
import { db } from "./db.js";
import { xpTable } from "@workspace/db";
import { isDoubleXpActive } from "./doubleXp.js";

// Single source of truth for level → role name mapping.
// Role names must match exactly what's created in your Discord server.
export const LEVEL_ROLES: Record<number, string> = {
  5:  "Level 5",
  10: "Level 10",
  20: "Level 20",
  50: "Level 50",
};

export const XP_PER_MESSAGE = 15;
export const XP_COOLDOWN_MS = 45_000; // 45 s cooldown (down from 60 s)
const cooldowns = new Map<string, number>();

// Lowered thresholds — roughly 40% of the old formula.
// Level 0→1: 30 XP,  1→2: 45 XP,  2→3: 70 XP,  3→4: 105 XP,  4→5: 150 XP
// (old was 100 / 155 / 220 / 295 / 380)
export function xpForLevel(level: number): number {
  return 5 * level * level + 10 * level + 30;
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

export async function addXp(
  userId: string,
  guildId: string
): Promise<{ leveled: boolean; newLevel: number } | null> {
  const key = `${userId}:${guildId}`;
  const now = Date.now();
  if ((cooldowns.get(key) ?? 0) + XP_COOLDOWN_MS > now) return null;
  cooldowns.set(key, now);

  const existing = await db.query.xpTable.findFirst({
    where: and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)),
  });

  // Double XP during active events
  const xpGain = isDoubleXpActive() ? XP_PER_MESSAGE * 2 : XP_PER_MESSAGE;
  const currentXp = (existing?.xp ?? 0) + xpGain;
  const newLevel = levelFromXp(currentXp);
  const leveled = newLevel > (existing?.level ?? 0);

  if (existing) {
    await db
      .update(xpTable)
      .set({ xp: currentXp, level: newLevel, lastMessageAt: new Date() })
      .where(and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)));
  } else {
    await db
      .insert(xpTable)
      .values({ userId, guildId, xp: currentXp, level: newLevel, lastMessageAt: new Date() });
  }

  return { leveled, newLevel };
}

export async function getUserXp(userId: string, guildId: string) {
  return db.query.xpTable.findFirst({
    where: and(eq(xpTable.userId, userId), eq(xpTable.guildId, guildId)),
  });
}

export async function getLeaderboard(guildId: string, limit = 10) {
  return db
    .select()
    .from(xpTable)
    .where(eq(xpTable.guildId, guildId))
    .orderBy(desc(xpTable.xp))
    .limit(limit);
}
