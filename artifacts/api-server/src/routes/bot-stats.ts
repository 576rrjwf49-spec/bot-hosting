import { Router, type IRouter } from "express";
import { readFileSync, existsSync } from "fs";
import { readFileSync as readCommandsFile } from "fs";

const router: IRouter = Router();

const DISCORD_API = "https://discord.com/api/v10";

let cache: { data: object; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

/** Reads the status file written by /setstatus command. Defaults to "online". */
function getStoredStatus(): "online" | "maintenance" {
  try {
    const raw = readFileSync("/tmp/bot-status.json", "utf-8");
    const parsed = JSON.parse(raw) as { status?: string };
    if (parsed.status === "maintenance") return "maintenance";
  } catch { /* file not yet written */ }
  return "online";
}

/** Reads the live command count from the bot's manifest. */
function getLiveCommandCount(): number {
  try {
    const raw = readFileSync("/tmp/bot-commands.json", "utf-8");
    const cmds = JSON.parse(raw) as unknown[];
    return Array.isArray(cmds) ? cmds.length : 39;
  } catch {
    return 39;
  }
}

router.get("/bot-stats", async (req, res) => {
  const token = process.env.DISCORD_TOKEN;
  const storedStatus = getStoredStatus();
  const commandCount = getLiveCommandCount();

  if (!token) {
    res.json({
      serverCount: 0,
      botName: "Scary Juan",
      botTag: "Scary Juan#0",
      online: false,
      status: "offline" as const,
      commandCount,
    });
    return;
  }

  if (cache && Date.now() < cache.expiresAt) {
    // Refresh the status field from file on each request (it can change any time)
    const cached = { ...(cache.data as Record<string, unknown>), status: storedStatus };
    res.json(cached);
    return;
  }

  try {
    const headers = {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    };

    const [userRes, guildsRes] = await Promise.all([
      fetch(`${DISCORD_API}/users/@me`, { headers }),
      fetch(`${DISCORD_API}/users/@me/guilds`, { headers }),
    ]);

    if (!userRes.ok || !guildsRes.ok) throw new Error("Discord API error");

    const user   = (await userRes.json())  as { username: string; discriminator: string };
    const guilds = (await guildsRes.json()) as unknown[];

    const data = {
      serverCount:  guilds.length,
      botName:      user.username,
      botTag:       user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`,
      online:       true,
      status:       storedStatus,
      commandCount,
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(data);
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Discord stats");
    res.json({
      serverCount:  0,
      botName:      "Scary Juan",
      botTag:       "Scary Juan#0",
      online:       false,
      status:       "offline" as const,
      commandCount,
    });
  }
});

export default router;
