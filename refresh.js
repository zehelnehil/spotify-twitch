const express = require('express');
const axios = require('axios');
const qs = require('qs');

const app = express();
const port = 8888;

const client_id = '';
const client_secret = '';
const redirect_uri = ``;
const scope = 'user-modify-playback-state user-read-playback-state playlist-read-private playlist-read-collaborative user-library-read';

const auth_url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;

app.get('/', (req, res) => {
  res.send(`<a href="${auth_url}">Authorize with Spotify</a>`);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { data } = await axios.post('https://accounts.spotify.com/api/token', qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
      client_secret,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in } = data;
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    console.log('Expires in:', expires_in, 'seconds');

    res.send('Authorization successful! Check your console for the access token.');
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Error requesting tokens:', error.response.data);
    } else {
      console.error('Error requesting tokens:', error.message);
    }

    res.send('Authorization failed! Check your console for the error message.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
