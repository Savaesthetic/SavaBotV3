const { SlashCommandBuilder } = require('discord.js');
const { queueSong } = require('../player.js');
const { ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays audio from given youtube video.')
    .addChannelOption(option =>
      option.setName('channel')
                     .setDescription('The channel to join.')
                     .setRequired(true)
                     .addChannelTypes(ChannelType.GuildVoice))
    .addStringOption(option =>
      option.setName('site')
        .setDescription('Website to grab audio from')
        .setRequired(true)
        .addChoices(
          { name: 'Youtube', value: 'youtube' },
          { name: 'Soundcloud', value: 'soundcloud' }
        ))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of value passed in.')
        .setRequired(true)
        .addChoices(
          { name: 'URL', value: 'url' },
          { name: 'Title', value: 'title' }
        ))
    .addStringOption(option =>
      option.setName('value')
        .setDescription('Url or video title')
        .setRequired(true)
    ),
  async execute(interaction) {
    // have to defer reply here because grabbing song, downloading song, and starting to play song might take some time
    await interaction.deferReply();
    
    let site = interaction.options.getString('site');
    let type = interaction.options.getString('type');
    let val = interaction.options.getString('value');
    let connectionInfo = {
      channelId: interaction.options.getChannel('channel').id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    }
    
    let { msg, player } = await queueSong(site, 
                                          type, 
                                          val, 
                                          connectionInfo, 
                                          interaction.channel);
    // once all of the work is done we can edit the defered reply with the actual message
    await interaction.editReply(msg);
  },
};