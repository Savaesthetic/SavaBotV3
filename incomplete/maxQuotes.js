const { SlashCommandBuilder } = require('discord.js');
// do we even need a max qutoe command?
let tempChoices = ['hey', 'this', 'is'];
// have to think about how to delete quote
// add autocomplete to interactions structure (MORE WORK)
// settle for listing choices (25 quotes max)
// require id which will require a get all quotes to display every quote with its id

// all options require replit database to be added to project

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maxquote')
    .setDescription('Get, create, or delete a max quote.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('get')
        .setDescription('Get a random Max quote'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Save a Max quote to the db')
        .addStringOption(option =>
          option
            .setName('quote')
            .setDescription('Quote to save.')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a Max quote from the db')
        .setStringOption(option =>
          option
            .setName('quote')
            .setDescription('Quote to delete.')
            .setRequired(true)
            .addChoices)),
  async execute(interaction) {
    await interaction.reply('Cleared player. Disconnecting Bot.');
  },
};