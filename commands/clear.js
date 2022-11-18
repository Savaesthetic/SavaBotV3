const { SlashCommandBuilder } = require('discord.js');
const { clearPlayer } = require('../player.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the current player and disconnects the bot.'),
  async execute(interaction) {
    let clearedPlayer = clearPlayer();
    await interaction.reply('Cleared player. Disconnecting Bot.');
  },
};