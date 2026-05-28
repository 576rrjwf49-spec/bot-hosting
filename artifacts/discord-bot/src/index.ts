import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

console.log("TOKEN EXISTS:", !!process.env.DISCORD_TOKEN);

client.once("ready", () => {
  console.log(`ONLINE AS ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("LOGIN SUCCESS"))
  .catch(console.error);
