const { SlashCommandBuilder } = require('discord.js');
const { clearPlayer } = require('../musicplayer/player.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the current player and disconnects the bot.'),
  async execute(interaction) {
    let msg = clearPlayer();
    await interaction.reply(msg);
  },
};