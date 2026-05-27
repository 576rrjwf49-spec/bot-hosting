import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DISCORD_API = "https://discord.com/api/v10";
const COMMAND_COUNT = 25;

let cache: { data: object; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

router.get("/bot-stats", async (req, res) => {
  const token = process.env.DISCORD_TOKEN;

  if (!token) {
    res.json({
      serverCount: 0,
      botName: "Scary Juan",
      botTag: "Scary Juan#0",
      online: false,
      commandCount: COMMAND_COUNT,
    });
    return;
  }

  if (cache && Date.now() < cache.expiresAt) {
    res.json(cache.data);
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

    if (!userRes.ok || !guildsRes.ok) {
      throw new Error("Discord API error");
    }

    const user = (await userRes.json()) as { username: string; discriminator: string };
    const guilds = (await guildsRes.json()) as unknown[];

    const data = {
      serverCount: guilds.length,
      botName: user.username,
      botTag: user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`,
      online: true,
      commandCount: COMMAND_COUNT,
    };

    cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(data);
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Discord stats");
    res.json({
      serverCount: 0,
      botName: "Scary Juan",
      botTag: "Scary Juan#0",
      online: false,
      commandCount: COMMAND_COUNT,
    });
  }
});

export default router;
