import { REST, Routes } from "discord.js";
import type { Client } from "discord.js";
import { allCommands } from "../commands/index.js";
import { setRegistry } from "../commands/help.js";

export async function onReady(client: Client): Promise<void> {
  console.log(`✅ Logged in as ${client.user?.tag}`);

  // Wire the help command's registry
  setRegistry(allCommands);

  // Register slash commands globally
  const token = process.env.DISCORD_TOKEN!;
  const clientId = client.user!.id;
  const rest = new REST({ version: "10" }).setToken(token);

  try {
    const body = allCommands.map((cmd) => cmd.data.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log(`✅ Registered ${body.length} slash commands globally.`);
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}
