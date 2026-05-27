import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

export const pollCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll")
    .addStringOption((opt) => opt.setName("question").setDescription("Poll question").setRequired(true))
    .addStringOption((opt) => opt.setName("option1").setDescription("Option 1").setRequired(true))
    .addStringOption((opt) => opt.setName("option2").setDescription("Option 2").setRequired(true))
    .addStringOption((opt) => opt.setName("option3").setDescription("Option 3 (optional)").setRequired(false))
    .addStringOption((opt) => opt.setName("option4").setDescription("Option 4 (optional)").setRequired(false)),
  category: "Games",
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const options = [
      interaction.options.getString("option1", true),
      interaction.options.getString("option2", true),
      interaction.options.getString("option3"),
      interaction.options.getString("option4"),
    ].filter(Boolean) as string[];

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join("\n\n"))
      .setFooter({ text: `Poll by ${interaction.user.username}` })
      .setColor(0xfee75c)
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]);
    }
  },
};
