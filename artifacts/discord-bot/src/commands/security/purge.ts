import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { Command } from "../index.js";

export const purgeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages in the current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("Number of messages to delete (1–100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Only delete messages from this user (optional)")
        .setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const filterUser = interaction.options.getUser("user");
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    let messages = await channel.messages.fetch({ limit: 100 });

    // Filter by user if specified
    if (filterUser) {
      messages = messages.filter((m) => m.author.id === filterUser.id);
    }

    // Discord only allows bulk delete for messages < 14 days old
    const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletable = [...messages.values()]
      .filter((m) => m.createdTimestamp > twoWeeks)
      .slice(0, amount);

    if (!deletable.length) {
      await interaction.editReply("❌ No deletable messages found (messages older than 14 days cannot be bulk deleted).");
      return;
    }

    const deleted = await channel.bulkDelete(deletable, true);

    await interaction.editReply(
      `🗑️ Deleted **${deleted.size}** message${deleted.size === 1 ? "" : "s"}${filterUser ? ` from ${filterUser.username}` : ""}.`
    );
  },
};
