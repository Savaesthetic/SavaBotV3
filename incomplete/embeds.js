const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const exampleEmbed = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Test embed message'),
  async execute(interaction) {
    await interaction.reply({
      content: 'test',
      embeds: [exampleEmbed],
    });
  },
};