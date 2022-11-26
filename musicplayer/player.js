const yts = require('yt-search');
const { joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus } = require('@discordjs/voice');
const { hyperlink } = require('discord.js');
const { downloadYoutubeVideo, downloadSoundcloudAudio } = require('./apiAccess.js');

let connection = null;
let audioPlayer = null;
let subscription = null;
let responseChannel = null;

const player = {
  currentSong: null,
  songQueue: [],
}

exports.queueSongs = async (videos, connectionInfo, channel) => {
  let error = false;
  if (!responseChannel) {
    responseChannel = channel;
  }

  if (videos.length === 0) {
    error = true;
    return 'Error. No videos added to the queue.';
  }

  for (let i = 0; i < videos.length; i++) {
    player.songQueue.push(videos[i]);
    if (i < 3) {
      responseChannel.send(`Added **${hyperlink(videos[i].title, videos[i].url)}** to song queue.`);
    }
  }
  if ((videos.length - 3) > 0) {
    responseChannel.send(`Also added ${videos.length - 3} more videos to the queue.`);
  }

  if (!error) {
    if (!connection) {
      connection = joinVoiceChannel(connectionInfo);
    }
    if (!audioPlayer) {
      audioPlayer = createAudioPlayer();
      subscription = connection.subscribe(audioPlayer);

      audioPlayer.on(AudioPlayerStatus.Idle, () => {
        playNextSong();
      });

      audioPlayer.on('error', error => {
        console.log('ERROR WITH AUDIO PLAYER');
        console.log(`Error: ${error.message}`);
      })

      if (!player.currentSong) {
        await playNextSong();
      }
    }
  }

  return 'Completed queuing operation.';
}

exports.skipSongs = async (num) => {
  let removed = 0;

  if (!audioPlayer) {
    return 'There are no songs currently playing.';
  }
  // stops the current song playing if there is one.
  audioPlayer.pause();

  // Skips songs by removing the current song and # songs from the queue
  // num is always at least 1
  if (player.currentSong) {
    player.currentSong = null;
    num--;
    removed++;
  }
  while (num > 0 && player.songQueue.length) {
    player.songQueue.shift();
    num--;
    removed++;
  }

  responseChannel.send(`Skipped ${removed} songs.`);
  if (!player.songQueue.length) {
    // queue is now empty after skipping so disconnect bot
    exports.clearPlayer();
    return `No songs remaining.\nDisconnecting Bot.`;
  }

  await playNextSong();

  return `Completed skipping operation`;
}

// returns the player object which can be parsed in the caller to output the current song
// and the desired number of songs in the queu
exports.getQueue = () => {
  return player;
}

exports.clearPlayer = () => {
  // remove the subscription from the connection to the audiplayer
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  // Stops the audiplayer if there is currently a song playing to prevent errors
  if (audioPlayer) {
    audioPlayer.stop();
    audioPlayer = null;
  }

  player.currentSong = null;
  player.songQueue = [];

  // Destroys the bots connection to the discord channel and disconnects the bot.
  if (connection) {
    connection.destroy();
    connection = null;
  }

  responseChannel = null;

  return 'Completed clearing operation.\nDisconnecting Bot.';
}

const playNextSong = async () => {
  // if there is a currently playing song then stop it
  audioPlayer.stop();
  player.currentSong = null;
  // if the queue is empty then just disconnect the bot and return
  // should be fine to use the clearPlayer function;
  if (!player.songQueue.length) {
    // might be some quality of life if i decide to add a small wait here
    // not sure of the race conditions if someone decides to add a song while its waiting
    exports.clearPlayer();
    return;
  }
  // set the current song to the first song in the queue
  player.currentSong = player.songQueue.shift();
  // download video audio and stream to audio.mp4 file

  if (player.currentSong.website === 'youtube') {
    try {
      await downloadYoutubeVideo(player.currentSong.download);
    } catch (err) {
      console.log(`Error with youtube download.\n${err}`);
      responseChannel.send(`Error downloading and creating audiofile for song:\n${player.currentSong.title}.`);
      await playNextSong();
      return;
    }
  } else {
    try {
      await downloadSoundcloudAudio(player.currentSong.download);
    } catch (err) {
      console.log(`Error with soundcloud download.\n${err}`);
      responseChannel.send(`Error downloading and creating audiofile for song:\n${player.currentSong.title}.`);
      await playNextSong();
      return;
    }
  }

  // create an audio resource from the audio file
  const resource = createAudioResource('../audio.mp4');
  // play the audio resource
  audioPlayer.play(resource);

  responseChannel.send(`Now playing **${hyperlink(player.currentSong.title,
    player.currentSong.url)}**.`);
  return;
}

// TODO pause??