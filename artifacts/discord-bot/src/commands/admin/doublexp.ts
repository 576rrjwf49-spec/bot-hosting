import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Client,
} from "discord.js";
import type { Command } from "../index.js";
import {
  activateDoubleXp,
  deactivateDoubleXp,
  isDoubleXpActive,
  getDoubleXpEnd,
  announceDoubleXp,
} from "../../lib/doubleXp.js";

const DURATIONS: Record<string, number> = {
  "15m": 15,
  "30m": 30,
  "1h":  60,
  "2h":  120,
};

export const doublexpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("doublexp")
    .setDescription("Start or stop a Double XP event (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt
        .setName("action")
        .setDescription("Start or stop the event")
        .setRequired(true)
        .addChoices(
          { name: "▶️  Start", value: "start" },
          { name: "⏹️  Stop",  value: "stop"  }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("duration")
        .setDescription("How long the event lasts (default: 30 minutes)")
        .addChoices(
          { name: "15 minutes", value: "15m" },
          { name: "30 minutes", value: "30m" },
          { name: "1 hour",     value: "1h"  },
          { name: "2 hours",    value: "2h"  }
        )
    ),

  category: "Admin",

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    const action = interaction.options.getString("action", true);

    // ── Stop ──────────────────────────────────────────────────────────────────
    if (action === "stop") {
      if (!isDoubleXpActive()) {
        await interaction.reply({
          content: "❌ There is no active Double XP event right now.",
          ephemeral: true,
        });
        return;
      }
      deactivateDoubleXp();
      await announceDoubleXp(client, false);
      await interaction.reply("✅ Double XP event has been ended.");
      return;
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    const durationKey = interaction.options.getString("duration") ?? "30m";
    const durationMin = DURATIONS[durationKey] ?? 30;
    const durationMs  = durationMin * 60_000;

    activateDoubleXp(durationMs);
    await announceDoubleXp(client, true, durationMin);

    const end   = getDoubleXpEnd()!;
    const endTs = Math.floor(end.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("⚡ Double XP Event Started!")
      .addFields(
        { name: "Duration", value: `${durationMin} minutes`, inline: true },
        { name: "Ends",     value: `<t:${endTs}:R>`,         inline: true }
      )
      .setFooter({ text: "Announced in all server announcement channels" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Auto-end after duration
    setTimeout(async () => {
      if (isDoubleXpActive()) {
        deactivateDoubleXp();
        await announceDoubleXp(client, false);
      }
    }, durationMs);
  },
};
