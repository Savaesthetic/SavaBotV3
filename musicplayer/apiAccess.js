const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const { WritableStream } = require("node:stream/web");

exports.youtubeSearch = async (searchParam, playlist) => {
  let res = await yts(searchParam);

  // given query to search which returns up to 10 videos. Pick first video
  if (typeof searchParam === "string") {
    if (res.videos.length === 0) {
      throw ('No videos found.');
    } else {
      let video = res.videos[0];
      return [{
        website: 'youtube',
        title: video.title,
        url: video.url,
        download: video.url,
      }];
    }
  }

  // given playlist url which returns all videos in playlist.
  if (playlist) {
    if (res.videos.length === 0) {
      throw ('No videos found.');
    } else {
      let videos = res.videos.map((video) => {
        return {
          website: 'youtube',
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          download: `https://www.youtube.com/watch?v=${video.videoId}`,
        };
      });
      return videos;
    }
  }

  // given video url which returns video
  return [{
    website: 'youtube',
    title: res.title,
    url: res.url,
    download: res.url,
  }];
}

exports.soundcloudSearch = async (url, playlist) => {
  let res = await fetch(`https://api-v2.soundcloud.com/resolve?url=${url}&client_id=${process.env.SOUNDCLOUD_ID}`, {
    Authorization: `OAuth ${process.env.SOUNDCLOUD_AUTH}`,
  });
  let data = await res.json();

  if (!playlist) {
    if (!data.hasOwnProperty('media')) {
      throw ('No media property so no transcodings.');
    }
    let transcodings = data.media.transcodings;
    let download;
    for (let i = 0; i < transcodings.length; i++) {
      if (transcodings[i].format?.protocol === 'progressive') {
        download = transcodings[i].url;
        break;
      }
    }
    if (download === undefined) throw ('No progressive transcoding.');


    return [{
      website: 'soundcloud',
      title: data.title,
      url: data.permalink_url,
      download: download,
    }]
  } else {
    // do playlist handling here if deciding to do it
    throw ('No playlist handling due to playlist resolve only fully resolving 4 songs.\n' +
      'Would need to resolve each song individually and i dont want to run into rate issues.');
  }
}

exports.downloadYoutubeVideo = async (url) => {
  let readable = ytdl(url,
    { filter: "audioonly", quality: "highestaudio" });
  let writeable = fs.createWriteStream("../audio.mp4");
  await pipeline(readable, writeable);
}

exports.downloadSoundcloudAudio = async (url) => {
  let res = await fetch(`${url}?client_id=${process.env.SOUNDCLOUD_ID}`, {
    Authorization: `OAuth ${process.env.SOUNDCLOUD_AUTH}`,
  });
  let data = await res.json();

  if (!data.hasOwnProperty('url')) {
    throw ('No download url for Soundcloud audio.');
  }

  let audio = await fetch(data.url);
  const dest = fs.createWriteStream("../audio.mp4");
  const stream = new WritableStream({
    write(chunk) {
      dest.write(chunk);
    },
  });
  console.log(audio);
  console.log(audio.body);
  await audio.body.pipeTo(stream);
}