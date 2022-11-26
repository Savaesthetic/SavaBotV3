exports.youtubeUrlParse = (url, playlist) => {
  let urlComponents = url.split("?");
  if (urlComponents.length === 1) {
    throw ("Invalid url given. No paramaters.");
  } else if (!urlComponents[0].includes("youtube.com")) {
    throw ("Invalid url given. Not a youtube url.");
  } else {
    let params = urlComponents[1].split("&");
    let target = playlist ? 'list' : 'v';
    let id;
    for (let i = 0; i < params.length; i++) {
      let paramComponents = params[i].split("=");
      if (paramComponents[0] === target) {
        id = paramComponents[1];
        break;
      }
    }
    if (id === undefined) throw ("Required id parameter not found in url.");

    return playlist ? { listId: id } : { videoId: id };
  }
}

exports.soundcloudUrlParse = (url) => {
  if (!url.includes('soundcloud.com')) {
    throw ("Invalid url given. Not a soundcloud url.");
  }
  return url;
}