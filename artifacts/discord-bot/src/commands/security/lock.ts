import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { Command } from "../index.js";

export const lockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock the current channel so members cannot send messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("Reason for locking").setRequired(false)
    ),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const everyoneRole = interaction.guild?.roles.everyone;

    if (!everyoneRole) {
      await interaction.reply({ content: "❌ Could not find the @everyone role.", ephemeral: true });
      return;
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
    });

    await interaction.reply(`🔒 **Channel locked** by <@${interaction.user.id}>.\n**Reason:** ${reason}`);
  },
};
