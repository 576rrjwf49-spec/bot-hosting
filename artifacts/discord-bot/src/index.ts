import { createServer } from "http";
import { writeFileSync } from "fs";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onMessageCreate, onGuildMemberAdd } from "./events/messageCreate.js";
import { allCommands } from "./commands/index.js";

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

// Tiny health-check server — uses BOT_HEALTH_PORT so it never clashes with the API server's PORT
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

client.once("ready", () => onReady(client));
client.on("interactionCreate", (interaction) => onInteractionCreate(interaction, client));
client.on("messageCreate", (message) => onMessageCreate(message, client));
client.on("guildMemberAdd", (member) => onGuildMemberAdd(member, client));

client.on("error", (err) => console.error("Discord client error:", err));

client.login(token);
