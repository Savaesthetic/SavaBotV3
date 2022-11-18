const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../player.js');

const formatQueue = (player) => {
  let { currentSong, songQueue } = player;

  // Build the output string for the queue
  let queueString = "Queue: [\n";
  for (let i = 0; i < songQueue.length && i < 10; i++) {
    queueString += songQueue[i].title + ",\n";
  }
  let remQueueLength = songQueue.length - 10;
  queueString += remQueueLength >= 0 ? `+${remQueueLength.toString()}\n`
    : `+0\n`;
  queueString += "]";

  return `Current Song: ${currentSong ? currentSong.title : 'None'}\n${queueString}`;
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