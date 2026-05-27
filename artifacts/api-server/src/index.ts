import { spawn } from "child_process";
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

// Launch the Discord bot as a side process when the token is available
if (process.env.DISCORD_TOKEN) {
  const bot = spawn(
    "pnpm",
    ["--filter", "@workspace/discord-bot", "run", "start"],
    {
      stdio: "inherit",
      env: { ...process.env },
    }
  );

  bot.on("exit", (code) => {
    logger.warn({ code }, "Discord bot process exited — restarting in 5s");
    setTimeout(() => {
      spawn("pnpm", ["--filter", "@workspace/discord-bot", "run", "start"], {
        stdio: "inherit",
        env: { ...process.env },
      });
    }, 5000);
  });

  logger.info("Discord bot process started");
}
