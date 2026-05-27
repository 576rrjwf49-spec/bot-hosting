import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction, type Client } from "discord.js";
import type { Command } from "./index.js";

// Dynamically imported to avoid circular dep — populated after full registry loads
let _registry: Command[] = [];
export function setRegistry(cmds: Command[]) { _registry = cmds; }

const CATEGORY_ICONS: Record<string, string> = {
  "Music":     "🎵",
  "GIFs & Video": "🖼️",
  "AI & Info": "🤖",
  "Games":     "🎮",
  "XP System": "⭐",
  "Admin":     "🔧",
  "General":   "📋",
};

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands")
    .addStringOption((opt) =>
      opt.setName("command").setDescription("Get details on a specific command").setRequired(false)
    ),
  category: "General",

  async execute(interaction: ChatInputCommandInteraction) {
    const specific = interaction.options.getString("command");

    if (specific) {
      const cmd = _registry.find((c) => c.data.name === specific.toLowerCase());
      if (!cmd) {
        await interaction.reply({ content: `❌ No command named \`/${specific}\` found.`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`/${cmd.data.name}`)
        .setDescription(cmd.data.description)
        .addFields({ name: "Category", value: `${CATEGORY_ICONS[cmd.category] ?? "📋"} ${cmd.category}` })
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Group by category
    const grouped = new Map<string, Command[]>();
    for (const cmd of _registry) {
      const list = grouped.get(cmd.category) ?? [];
      list.push(cmd);
      grouped.set(cmd.category, list);
    }

    const embed = new EmbedBuilder()
      .setTitle("📖 Bot Commands")
      .setDescription("Use `/help command:<name>` for details on any command.\nCommands are automatically added here when new ones are registered.")
      .setColor(0x5865f2)
      .setFooter({ text: `${_registry.length} commands available` });

    for (const [category, cmds] of grouped) {
      const icon = CATEGORY_ICONS[category] ?? "📋";
      embed.addFields({
        name: `${icon} ${category}`,
        value: cmds.map((c) => `\`/${c.data.name}\` — ${c.data.description}`).join("\n"),
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
