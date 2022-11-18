const yts = require('yt-search');
const { joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { pipeline } = require('stream/promises');

let connection = null;
let audioPlayer = null;
let subscription = null;
let responseChannel = null;

const player = {
  currentSong: null,
  songQueue: [],
}

exports.queueSong = async (website, type, value, connectionInfo, channel) => {
  let error = false;
  let returnMessage = 'Initializing';
  if (!responseChannel) {
    responseChannel = channel;
  }

  if (website === 'youtube') {
    if (type === 'title') {
      try {
        let res = await yts({ query: value });
        let videos = res.videos;
        if (!videos.length) {
          returnMessage = `No results found for ${title}.`;
        } else {
          player.songQueue.push(videos[0]);
          returnMessage = `Added **${videos[0].title}** to songQueue.`;
        }
      } catch (err) {
        error = true;
        returnMessage = err;
      }
    } else {
      try {
        let videoId = getIdFromURL(value);
        try {
          let video = await yts({ videoId: videoId });
          player.songQueue.push(video);
          returnMessage = `Added **${video.title}** to songQueue.`;
        } catch (err) {
          error = true;
          returnMessage = err;
        }
      } catch (err) {
        error = true;
        returnMessage = err;
      }
    }
  } else {
    error = true;
    // TODO ADD SOUNDCLOUD FUNCTIONALITY
    returnMessage = 'Still have to add soundcloud functionality';
  }

  if (!error) {
    if (!connection) {
      connection = joinVoiceChannel(connectionInfo);
    }
    if (!audioPlayer) {
      audioPlayer = createAudioPlayer();
      subscription = connection.subscribe(audioPlayer);

      audioPlayer.on(AudioPlayerStatus.Idle, () => {
        playNextSong(true);
      });

      audioPlayer.on('error', error => {
        console.log('ERROR WITH AUDIO PLAYER');
        console.log(`Error: ${error.message}`);
      })

      if (!player.currentSong && player.songQueue.length === 1) {
        returnMessage = await playNextSong(false);
      }
    }
  }

  return { msg: returnMessage, player: player };
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

  if (!player.songQueue.length) {
    // queue is now empty after skipping so disconnect bot
    exports.clearPlayer();
    return `Skipped ${removed} songs. No songs remaining. Disconnecting Bot.`;
  }

  let playingMessage = await playNextSong(false);

  return `Skipped ${removed} songs.\n${playingMessage}`;
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

  return player;
}

const playNextSong = async (sendMessage) => {
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
  try {
    await streamDownloadToFile();
  } catch (err) {
    console.log(`ERROR WITH STREAM DOWNLOAD\n${err}`);
    if (sendMessage && responseChannel) {
      return `Error downloading and creating audiofile for song:\n${player.currentSong.title}.`;
    } else {
      responseChannel.send(`Error downloading and creating audiofile for song:\n${player.currentSong.title}.`);
    }
  }
  // create an audio resource from the audio file
  const resource = createAudioResource('./audio.mp4');
  // play the audio resource
  audioPlayer.play(resource);

  if (sendMessage && responseChannel) {
    responseChannel.send(`Now playing **${player.currentSong.title}**.`);
  } else {
    return `Now playing **${player.currentSong.title}**.`;
  }
}

// TODO pause??

const getIdFromURL = (url) => {
  let urlComponents = url.split("?");
  if (urlComponents.length === 1) {
    throw ("Invalid url given. No paramaters.");
  } else if (!urlComponents[0].includes("youtube")) {
    throw ("Invalid url given. Not a youtube url.");
  } else {
    let params = urlComponents[1].split("&");
    let videoId;
    for (let i = 0; i < params.length; i++) {
      let paramComponents = params[i].split("=");
      if (paramComponents[0] === "v") {
        videoId = paramComponents[1];
        break;
      }
    }
    if (videoId === undefined) throw ("Invalid url given. No video id param.");

    return videoId;
  }
};

const streamDownloadToFile = async () => {
  let readable = ytdl(player.currentSong.url,
    { filter: "audioonly", quality: "highestaudio" });
  let writeable = fs.createWriteStream("audio.mp4");
  await pipeline(readable, writeable);
}