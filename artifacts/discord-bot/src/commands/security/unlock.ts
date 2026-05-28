import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { Command } from "../index.js";

export const unlockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock the current channel so members can send messages again")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  category: "Security",
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel as TextChannel;
    const everyoneRole = interaction.guild?.roles.everyone;

    if (!everyoneRole) {
      await interaction.reply({ content: "❌ Could not find the @everyone role.", ephemeral: true });
      return;
    }

    await channel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: null, // resets to the role/category default
    });

    await interaction.reply(`🔓 **Channel unlocked** by <@${interaction.user.id}>.`);
  },
};
