const { SlashCommandBuilder, hyperlink, hideLinkEmbed } = require('discord.js');
const { getQueue } = require('../musicplayer/player.js');

const formatQueue = (player) => {
  let { currentSong, songQueue } = player;

  // Build the output string for the queue
  let queueString = "Queue: [\n";
  for (let i = 0; i < songQueue.length && i < 10; i++) {
    queueString += hyperlink(songQueue[i].title, hideLinkEmbed(songQueue[i].url)) + ",\n";
  }
  let remQueueLength = songQueue.length - 10;
  queueString += remQueueLength >= 0 ? `+${remQueueLength.toString()}\n`
    : `+0\n`;
  queueString += "]";

  return `Current Song: ${currentSong ?
    hyperlink(currentSong.title, hideLinkEmbed(currentSong.url)) :
    'None'}\n${queueString}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Returns the current music queue.'),
  async execute(interaction) {
    const player = getQueue();
    await interaction.reply(formatQueue(player));
  },
};