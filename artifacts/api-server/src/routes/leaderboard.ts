import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { xpTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// Simple in-memory cache so we don't hammer Discord for every request
const usernameCache = new Map<string, { username: string; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function resolveUsername(userId: string): Promise<string> {
  const cached = usernameCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.username;
  }

  const token = process.env.DISCORD_TOKEN;
  if (!token) return userId;

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return userId;

    const user = (await res.json()) as { username: string; global_name?: string };
    // Prefer display name (global_name) over username
    const name = user.global_name ?? user.username ?? userId;
    usernameCache.set(userId, { username: name, fetchedAt: Date.now() });
    return name;
  } catch {
    return userId;
  }
}

router.get("/leaderboard", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(xpTable)
      .orderBy(desc(xpTable.xp))
      .limit(10);

    // Resolve all usernames in parallel
    const usernames = await Promise.all(rows.map((row) => resolveUsername(row.userId)));

    const entries = rows.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      username: usernames[i] ?? row.userId,
      guildId: row.guildId,
      level: row.level,
      xp: row.xp,
    }));

    res.json(entries);
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch leaderboard");
    res.json([]);
  }
});

export default router;
