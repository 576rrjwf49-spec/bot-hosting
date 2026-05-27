import { Client, GatewayIntentBits, Partials } from "discord.js";
import { onReady } from "./events/ready.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onMessageCreate, onGuildMemberAdd } from "./events/messageCreate.js";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN is not set. Add it to your secrets.");
  process.exit(1);
}

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
