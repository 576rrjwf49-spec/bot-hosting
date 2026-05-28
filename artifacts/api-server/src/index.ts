import { spawn, type ChildProcess } from "child_process";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// ── Discord bot process manager ───────────────────────────────────────────────
if (process.env.DISCORD_TOKEN) {
  const { PORT: _omit, ...botEnv } = process.env;

  let currentBot: ChildProcess | null = null;
  let scheduledKill = false; // true when we intentionally kill for a scheduled restart

  function spawnBot() {
    const proc = spawn(
      "pnpm",
      ["--filter", "@workspace/discord-bot", "run", "start"],
      { stdio: "inherit", env: { ...botEnv, BOT_HEALTH_PORT: "8082" } }
    );

    proc.on("exit", (code) => {
      if (scheduledKill) {
        // Intentional — respawn immediately
        scheduledKill = false;
        logger.info("Bot restarted on schedule");
        currentBot = spawnBot();
      } else {
        // Unexpected crash — wait 5 s before respawning
        logger.warn({ code }, "Discord bot process exited — restarting in 5s");
        setTimeout(() => {
          currentBot = spawnBot();
        }, 5_000);
      }
    });

    return proc;
  }

  currentBot = spawnBot();
  logger.info("Discord bot process started");

  // ── Hourly scheduled restart starting at 1:00 PM AEST (UTC+10 = 03:00 UTC) ─
  const START_HOUR_UTC = 3; // 13:00 AEST = 03:00 UTC

  function msUntilNextRestart(): number {
    const now = new Date();

    // Next top-of-hour at or after START_HOUR_UTC
    const candidate = new Date(now);
    candidate.setUTCMinutes(0, 0, 0);
    candidate.setUTCHours(candidate.getUTCHours() + 1); // next full UTC hour

    // If that hour is before the start hour, jump straight to start hour today
    if (candidate.getUTCHours() < START_HOUR_UTC) {
      candidate.setUTCHours(START_HOUR_UTC, 0, 0, 0);
    }

    // If still in the past, bump one hour
    if (candidate <= now) {
      candidate.setUTCHours(candidate.getUTCHours() + 1, 0, 0, 0);
    }

    return candidate.getTime() - now.getTime();
  }

  function scheduleNext() {
    const ms = msUntilNextRestart();
    const at = new Date(Date.now() + ms);
    logger.info({ nextRestart: at.toISOString() }, "Next scheduled bot restart");

    setTimeout(() => {
      logger.info("Triggering scheduled hourly bot restart");
      scheduledKill = true;
      currentBot?.kill("SIGTERM");

      // Schedule the one after that
      scheduleNext();
    }, ms);
  }

  scheduleNext();
}
