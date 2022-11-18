const { SlashCommandBuilder } = require('discord.js');
const { skipSongs } = require('../player.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips # songs from the player.')
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('Number of songs to skip.')
        .setMinValue(1)
        .setMaxValue(100)
    ),
  async execute(interaction) {
    // have to defer reply here because grabbing song, downloading song, and starting to play song might take some time after skip
    await interaction.deferReply();

    let num = interaction.options.getInteger('number') ?? 1;
    let message = await skipSongs(num);

    await interaction.editReply(message);
  },
};