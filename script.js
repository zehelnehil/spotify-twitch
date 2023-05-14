const tmi = require('tmi.js');
const axios = require('axios');

const twitchClient = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true,
  },
  identity: {
    username: "YOURBOTUSERNAME",
    password: "OAUTHTOKENHERE",
  },
  channels: ["CHANNELNAME"],
});

const clientId = '';
const clientSecret = '';
const refreshToken = '';


async function getAccessToken() {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    return null;
  }
}


async function spotifyApiRequest(url, accessToken, method = 'GET', data = null) {
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      data,
    });

    return response.data;
  } catch (error) {
    console.error(`Error in Spotify API request (${url}):`, error.message);
    return null;
  }
}

// Fetch track, album, or playlist details using Spotify API
async function fetchItemDetails(uri, accessToken) {
  const uriParts = uri.split(':');
  const itemType = uriParts[1];
  const itemId = uriParts[2];

  try {
    if (itemType === 'track') {
      const trackData = await spotifyApiRequest(`https://api.spotify.com/v1/tracks/${itemId}`, accessToken);
      const trackName = trackData.name;
      const artistName = trackData.artists.map(artist => artist.name).join(', ');
      return { name: trackName, artist: artistName, type: 'track' };
    } else if (itemType === 'album') {
      const albumData = await spotifyApiRequest(`https://api.spotify.com/v1/albums/${itemId}`, accessToken);
      const albumName = albumData.name;
      const artistName = albumData.artists.map(artist => artist.name).join(', ');
      return { name: albumName, artist: artistName, type: 'album' };
    } else if (itemType === 'playlist') {
      const playlistData = await spotifyApiRequest(`https://api.spotify.com/v1/playlists/${itemId}`, accessToken);
      const playlistName = playlistData.name;
      return { name: playlistName, type: 'playlist' };
    }
  } catch (error) {
    console.error(`Error fetching ${itemType} details:`, error.message);
  }

  return null;
}

async function getSpotifyUri(track, accessToken) {
  if (track.startsWith('https://open.spotify.com')) {
    const urlParts = track.split('/');
    const typeId = urlParts[4].split('?')[0];
    const typeName = urlParts[3];

    if (['track', 'album', 'playlist'].includes(typeName)) {
      return `spotify:${typeName}:${typeId}`;
    }
  } else if (track.startsWith('spotify:')) {
    return track;
  } else {
    const searchResult = await spotifyApiRequest(`https://api.spotify.com/v1/search?q=${encodeURIComponent(track)}&type=track&limit=1`, accessToken);
    if (searchResult.tracks.items.length > 0) {
      return searchResult.tracks.items[0].uri;
    }
  }

  return null;
}

async function playSpotify(track) {
  try {
    const accessToken = await getAccessToken();

    const trackUri = await getSpotifyUri(track, accessToken);

    if (!trackUri) {
      return { success: false };
    }

    const itemDetails = await fetchItemDetails(trackUri, accessToken);
    await spotifyApiRequest('https://api.spotify.com/v1/me/player/play', accessToken, 'PUT', { uris: [trackUri] });

    return { success: true, itemDetails };
  } catch (error) {
    console.error('Error playing Spotify track:', error.message);
    return { success: false };
  }
}

async function queueUpSpotify(track) {
    try {
      const accessToken = await getAccessToken();
  
      const trackUri = await getSpotifyUri(track, accessToken);
  
      if (!trackUri) {
        return { success: false };
      }
  
      const itemDetails = await fetchItemDetails(trackUri, accessToken);
  
      if (itemDetails.type === 'playlist') {
        const playlistTracks = await spotifyApiRequest(`https://api.spotify.com/v1/playlists/${trackUri.split(':')[2]}/tracks`, accessToken);
  
        if (playlistTracks.items.length > 0) {
          const firstTrackUri = playlistTracks.items[0].track.uri;
          await spotifyApiRequest(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(firstTrackUri)}`, accessToken, 'POST');
          await spotifyApiRequest('https://api.spotify.com/v1/me/player/play', accessToken, 'PUT', { context_uri: trackUri });
        } else {
          return { success: false };
        }
      } else {
        await spotifyApiRequest(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(trackUri)}`, accessToken, 'POST');
      }
  
      return { success: true, itemDetails };
    } catch (error) {
      console.error('Error queuing up Spotify track:', error.message);
      return { success: false };
    }
  }

async function skipSpotify() {
  try {
    const accessToken = await getAccessToken();

    await spotifyApiRequest('https://api.spotify.com/v1/me/player/next', accessToken, 'POST');
    return true;
  } catch (error) {
    console.error('Error skipping track:', error.message);
  }
}

twitchClient.connect();
twitchClient.on('message', async (channel, userstate, message, self) => {
    if (self) return;
  
    const [command, ...args] = message.trim().split(' ');
  
    if (userstate.mod || userstate.badges?.broadcaster === '1') {
      if (command === '!musicplay') {
        const track = args.join(' ');
        const result = await playSpotify(track);
        if (result.success) {
          if (result.itemDetails.type === 'track') {
            twitchClient.say(channel, `Playing ${result.itemDetails.name} by ${result.itemDetails.artist}.`);
          } else {
            twitchClient.say(channel, `Playing ${result.itemDetails.type} "${result.itemDetails.name}".`);
          }
        } else {
          twitchClient.say(channel, `Failed to play ${track} on Spotify.`);
        }
      } else if (command === '!queueup') {
        const track = args.join(' ');
        const result = await queueUpSpotify(track);
        if (result.success) {
          if (result.itemDetails.type === 'track') {
            twitchClient.say(channel, `Queued up ${result.itemDetails.name} by ${result.itemDetails.artist} on Spotify.`);
          } else {
            twitchClient.say(channel, `Queued up ${result.itemDetails.type} "${result.itemDetails.name}" on Spotify.`);
          }
        } else {
          twitchClient.say(channel, `Failed to queue up ${track}.`);
        }
      } else if (command === '!musicskip') {
        const success = await skipSpotify();
        if (success) {
          twitchClient.say(channel, `Skipped track.`);
        } else {
          twitchClient.say(channel, `Failed to skip track.`);
        }
      }
    }
  });
