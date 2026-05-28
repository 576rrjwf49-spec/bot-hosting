import "dotenv/config";
import { createServer } from "http";
import { writeFileSync } from "fs";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onMessageCreate, onGuildMemberAdd } from "./events/messageCreate.js";
import { allCommands } from "./commands/index.js";
import {
  activateDoubleXp,
  deactivateDoubleXp,
  isDoubleXpActive,
  announceDoubleXp,
} from "./lib/doubleXp.js";

// Write command manifest so the dashboard can display live commands
try {
  const manifest = allCommands.map((cmd) => ({
    name: cmd.data.name,
    description: (cmd.data as { description?: string }).description ?? "",
    category: cmd.category,
  }));
  writeFileSync("/tmp/bot-commands.json", JSON.stringify(manifest), "utf-8");
} catch {
  console.error("⚠️  Could not write command manifest");
}

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN is not set. Add it to your secrets.");
  process.exit(1);
}

// Tiny health-check server
const PORT = process.env.BOT_HEALTH_PORT ? parseInt(process.env.BOT_HEALTH_PORT) : 8082;
createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", bot: client.user?.tag ?? "connecting" }));
}).listen(PORT, () => console.log(`🌐 Health server listening on port ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ── Auto Double XP scheduler — fires every 3 hours, runs for 30 minutes ───────
function scheduleAutoDoubleXp() {
  const INTERVAL_MS   = 3 * 60 * 60_000; // every 3 hours
  const DURATION_MIN  = 30;
  const DURATION_MS   = DURATION_MIN * 60_000;

  async function runEvent() {
    console.log("🌟 Auto Double XP event starting");
    activateDoubleXp(DURATION_MS);
    await announceDoubleXp(client, true, DURATION_MIN);

    // End the event after the duration
    setTimeout(async () => {
      if (isDoubleXpActive()) {
        deactivateDoubleXp();
        await announceDoubleXp(client, false);
        console.log("🌟 Auto Double XP event ended");
      }
    }, DURATION_MS);
  }

  // First event fires 3 hours after bot starts, then every 3 hours
  setInterval(runEvent, INTERVAL_MS);
  console.log(`🌟 Auto Double XP scheduler active — events every 3 hours for ${DURATION_MIN} min`);
}

client.once("ready", () => {
  console.log("BOT IS READY");
  console.log(`LOGGED IN AS: ${client.user?.tag}`);

  onReady(client);
  scheduleAutoDoubleXp();
});

client.on("interactionCreate", (interaction) => onInteractionCreate(interaction, client));
client.on("messageCreate",     (message)     => onMessageCreate(message, client));
client.on("guildMemberAdd",    (member)      => onGuildMemberAdd(member, client));
client.on("error",             (err)         => console.error("Discord client error:", err));

console.log("TOKEN EXISTS:", !!token);
console.log("TOKEN LENGTH:", token?.length);
console.log("STARTING LOGIN...");

client.login(token)
  .then(() => console.log("LOGIN SUCCESS"))
  .catch((err) => console.error("LOGIN FAILED:", err));
