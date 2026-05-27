import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../index.js";

const TRUTHS = [
  "What is the most embarrassing thing you've ever done?",
  "What is your biggest fear?",
  "Have you ever lied to get out of trouble?",
  "What is the weirdest dream you've ever had?",
  "Who was your first crush?",
  "What is something you've never told anyone?",
  "What is your most used emoji?",
  "What is your guilty pleasure?",
  "Have you ever cheated in a game?",
  "What is the worst gift you've ever received?",
];

const DARES = [
  "Send a voice message saying 'I love broccoli'.",
  "Change your nickname to 'Potato' for the next hour.",
  "Send the last photo in your camera roll.",
  "Type a message using only your elbows.",
  "Use the words 'banana' in every message for the next 5 minutes.",
  "Write a haiku about the person to your left.",
  "Do your best impression of a celebrity.",
  "Tell a joke — if nobody laughs, do another dare.",
  "Sing the first line of any song.",
  "React to every message in this channel with 🥔 for 2 minutes.",
];

export const truthordareCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("truthordare")
    .setDescription("Get a truth or dare prompt")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Truth or Dare?")
        .setRequired(true)
        .addChoices({ name: "Truth", value: "truth" }, { name: "Dare", value: "dare" })
    ),
  category: "Games",
  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString("type", true) as "truth" | "dare";
    const list = type === "truth" ? TRUTHS : DARES;
    const prompt = list[Math.floor(Math.random() * list.length)];
    const embed = new EmbedBuilder()
      .setTitle(type === "truth" ? "🤔 Truth" : "🎯 Dare")
      .setDescription(prompt)
      .setColor(type === "truth" ? 0x5865f2 : 0xed4245)
      .setFooter({ text: `Requested by ${interaction.user.username}` });
    await interaction.reply({ embeds: [embed] });
  },
};
