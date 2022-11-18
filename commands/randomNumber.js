const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rng')
    .setDescription('Returns a random number in the given range.')
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Minimum Number')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('max')
        .setDescription('Maximum Number')
        .setRequired(true)
    ),
  async execute(interaction) {
    let range = interaction.options.getInteger('max') - interaction.options.getInteger('min');
    let absolute = Math.floor(Math.random() * (range + 1));
    let relative = absolute - Math.abs(interaction.options.getInteger('min'));
    await interaction.reply(relative.toString());
  },
};