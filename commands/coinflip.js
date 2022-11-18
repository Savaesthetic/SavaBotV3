const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flips a coin and returns heads or tails.'),
  async execute(interaction) {
    let flip = Math.floor(Math.random() * 2);
    let res = flip ? 'Heads' : 'Tails';
    await interaction.reply(res);
  },
};