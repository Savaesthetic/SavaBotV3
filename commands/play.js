const { SlashCommandBuilder } = require('discord.js');
const { queueSongs } = require('../musicplayer/player.js');
const { ChannelType } = require('discord.js');
const { youtubeUrlParse, soundcloudUrlParse } = require('../musicplayer/parseUrl.js');
const { youtubeSearch, soundcloudSearch } = require('../musicplayer/apiAccess.js');

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
    .addBooleanOption(option =>
      option.setName('playlist')
        .setDescription('Is a playlist')
        .setRequired(true))
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
    let playlist = interaction.options.getBoolean('playlist');
    let type = interaction.options.getString('type');
    let val = interaction.options.getString('value');
    let connectionInfo = {
      channelId: interaction.options.getChannel('channel').id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    }
    let channel = interaction.channel;

    if (playlist && type === 'title') {
      await interaction.editReply('Playlists must be supplied through url. Sorry.');
      return;
    }
    if (site === 'soundcloud' && type === 'title') {
      await interaction.editReply('Soundcloud tracks and playlists can only be played through url. Sorry.');
      return;
    }

    if (site === 'youtube') {
      // get Search param to be used for yts from val
      let searchParam;
      if (type === 'title') {
        searchParam = val;
      } else {
        try {
          searchParam = youtubeUrlParse(val, playlist);
        } catch (err) {
          await interaction.editReply(err);
          return;
        }
      }
      // Now use search param to actually search youtube with yts
      try {
        let videoArray = await youtubeSearch(searchParam, playlist);
        let msg = await queueSongs(videoArray, connectionInfo, channel);
        await interaction.editReply(msg);
        return;
      } catch (err) {
        console.log(err);
        await interaction.editReply("Unable to get search results from Youtube with given information.\nCheck Replit console for more detailed error log.");
        return;
      }
    } else {
      // site is soundcloud
      try {
        let verifiedUrl = await soundcloudUrlParse(val, playlist);
        try {
          let videoArray = await soundcloudSearch(verifiedUrl, playlist);
          let msg = await queueSongs(videoArray, connectionInfo, channel);
          await interaction.editReply(msg);
          return;
        } catch (err) {
          console.log(err);
          await interaction.editReply("Unable to get search results from Soundcloud with given information.\nCheck Replit console for more detailed error log.");
          return;
        }
      } catch (err) {
        await interaction.editReply(err);
        return;
      }
    }
  },
};