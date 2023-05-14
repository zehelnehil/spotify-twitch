The Twitch-Spotify Integration is a Node.js script that allows Twitch moderators and broadcasters to control Spotify playback directly from the Twitch chat. The script utilizes the TMI.js library to connect to Twitch and the Axios library to interact with the Spotify API.

Key Features:

    Play a Track: Moderators and broadcasters can use the !musicplay command followed by the name of a track to play it on Spotify. The script retrieves the track details, including the name and artist, and initiates playback.
    Queue Up a Track: The !queueup command allows moderators and broadcasters to add a track to the Spotify queue. If the track is part of a playlist, the script plays the first track and queues up the entire playlist.
    Skip Track: With the !musicskip command, moderators and broadcasters can skip the currently playing track on Spotify.

To use this script, the following steps are required:

    Obtain Twitch API credentials and provide them in the code.
    Obtain Spotify API credentials (Client ID, Client Secret, and Refresh Token) and provide them in the code.
    Install the required dependencies by running npm install in the project directory.
    Run the script using node script.js (replace script.js with the actual filename).

Please note that this script requires appropriate authentication and proper configuration of Twitch and Spotify API credentials. Without valid credentials, the script will not function correctly.

This script provides a seamless way to integrate Twitch chat commands with Spotify playback, allowing Twitch moderators and broadcasters to enhance their streaming experience and engage with their audience through music.
