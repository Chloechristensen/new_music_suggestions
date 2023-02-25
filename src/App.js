import './App.css';
import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const client_id = '262002b52d8c4dbc833d1e9a3eec5708';
const redirect_uri = 'http://localhost:3000';
const scopes = ['playlist-modify-public', 'playlist-modify-private', 'playlist-read-private','user-top-read', 'user-read-recently-played', 'user-library-modify', 'user-library-read', 'app-remote-control', 'streaming'];
const spotifyApi = new SpotifyWebApi();
let playlistId = "";
let trackIDs = "";
let timeline = "";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [topTracks, setTopTracks] = useState([]);
  const [topTracksImages, setTopTracksImages] = useState([]);
  const [topTrackNames, setTopTrackNames] = useState([]);
  const [topTrackRecommendations, setTopTrackRecommendations] = useState([]);
  const [topTrackIDs, setTopTrackIDs] = useState([]);
  const [newTrackImages, setNewTrackImages] = useState([]);
  const [newTrackName, setNewTrackName] =useState([]);

  useEffect(() => {
    const params = getHashParams();
    if (params.access_token) {
      spotifyApi.setAccessToken(params.access_token);
      setLoggedIn(true);
    }
  }, []);

  const getHashParams = () => {
    const hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  };

  const handleLogin = () => {
    const redirectUri = redirect_uri;
    const clientId = client_id;

    const url = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join(
      '%20'
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = url;
  };

const handlePlaylistSubmit = () => {
    spotifyApi.getMe()
      .then((user) => {
        spotifyApi.createPlaylist(user.id, { name: playlistName, public: false })
          .then((response) => {
          playlistId = response.id
            console.log('Playlist created: ', response);
          })
          .catch((error) => {
            console.error('Error creating playlist: ', error);
          });

      });
  }


//get the users top 10 tracks from the past 4 weeks
 const getTop10 = async () => {
   try {
     const response = await spotifyApi.getMyTopTracks({ limit: 10, time_range: timeline });

     const trackURIs = response.items.map((track) => track.uri);
     setTopTracks(trackURIs);

     //getting the top track IDs
     const trackIDs = response.items.map((track) => track.id);
     setTopTrackIDs(trackIDs);
     console.log(topTrackIDs);

     // Fetch images for each track
     const imagePromises = response.items.map((track) =>
       spotifyApi.getTrack(track.id).then((track) => track.album.images[0].url)
     );
     const images = await Promise.all(imagePromises);
     setTopTracksImages(images);

     const trackNames = response.items.map((track) => track.name);
     setTopTrackNames(trackNames);

     if (playlistId) {
       const recommendations = [];
       const recommendationImages = [];
       const newNames = [];
       for (let i = 0; i < trackIDs.length; i++) {
         const newTracks = await spotifyApi.getRecommendations({
           limit: 5,
           seed_tracks: [trackIDs[i]],
         });
         const newTrackURIs = newTracks.tracks.map((track) => track.uri);
         recommendations.push(...newTrackURIs);

         //get new trakc names
         const newTrackNames = newTracks.tracks.map((track) => track.name);
         newNames.push(...newTrackNames);

         // Fetch images for each new recommended track
         const newTrackImagePromises = newTracks.tracks.map((track) =>
           spotifyApi.getTrack(track.id).then((track) => track.album.images[0].url)
       );
       const newTrackImages = await Promise.all(newTrackImagePromises);
       recommendationImages.push(...newTrackImages);
     }
     setTopTrackRecommendations(recommendations);
     setNewTrackName(newNames);
     setNewTrackImages(recommendationImages); // set the state for the images array
     await spotifyApi.addTracksToPlaylist(playlistId, [...trackURIs, ...recommendations]);
     }
   } catch (error) {
     console.error(error);
   }
 };

const playTopTrack = () => {
  spotifyApi.play({ uris: [topTracks[0]] });
}

  const logout = () => {
    setLoggedIn(false)
    window.localStorage.removeItem('token')
  }

  return (
    <div className="App">
      <div>
        {loggedIn ? (
          <>
            <div class = "intro">New Music Suggestions Based off of Your Top 10 Recent Songs</div>
            <form>
              <label>
                <div className = "naming">
                  Name Your Playlist:
                </div>
                <div>
                  <input type="text" class="text" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} />
                </div>
              </label>
              <button type="button" class = "button" onClick={handlePlaylistSubmit}>Create Playlist</button>
              <div class = "timeline">
              Choose Your Timeline:
              </div>
              <div><button type = "button" class = "button" onClick = {timeline = 'short_term'}>Recent Tracks</button></div>
              <div><button type = "button" class = "button" onClick = {timeline = 'medium_term'}>Past 6 months</button></div>
              <div><button type = "button" class = "button" onClick = {timeline = 'long_term'}>Past Years</button></div>
              <div class = "timeline"> Add Your Top 10 & Suggestions: < /div>
              <div>
                <button type= "button" class = "addsongs" onClick = {getTop10}>Add Songs</button>
              </div>
            </form>
            <div className = "title">
              Your Top 10 Tracks and Suggestions
            </div>
            <div className="container1">
              <div className="rectangle1"><img src={topTracksImages[0]} alt="Albumart1"/><div class = "topName">#1 {topTrackNames[0]} </div><button type = "button" class = "smallButton" onClick = {playTopTrack}>Play</button></div>
              <div className="rectangle1">
                <div className = "mini1">
                <div class = "smallImage"> 1 <img src={newTrackImages[0]} alt="Albumart2" />{newTrackName[0]}</div>
                <div class = "smallImage"> 2 <img src={newTrackImages[1]} alt="Albumart2" />{newTrackName[1]}</div>
                <div class = "smallImage"> 3 <img src={newTrackImages[2]} alt="Albumart2" />{newTrackName[2]}</div>
                <div class = "smallImage"> 4 <img src={newTrackImages[3]} alt="Albumart2" />{newTrackName[3]}</div>
                <div class = "smallImage"> 5 <img src={newTrackImages[4]} alt="Albumart2" />{newTrackName[4]}</div>
                </div>
              </div>
            <div className= "container6">
              <div className="rectangle6"><img src={topTracksImages[1]} alt="Albumart1" /><div class = "topName">#2 {topTrackNames[1]}</div></div>
              <div className="rectangle6">
                <div className = "mini1">
                <div class = "smallImage"> 1 <img src={newTrackImages[5]} alt="Albumart2" />{newTrackName[5]}</div>
                <div class = "smallImage"> 2 <img src={newTrackImages[6]} alt="Albumart2" />{newTrackName[6]}</div>
                <div class = "smallImage"> 3 <img src={newTrackImages[7]} alt="Albumart2" />{newTrackName[7]}</div>
                <div class = "smallImage"> 4 <img src={newTrackImages[8]} alt="Albumart2" />{newTrackName[8]}</div>
                <div class = "smallImage"> 5 <img src={newTrackImages[9]} alt="Albumart2" />{newTrackName[9]}</div>
                </div>
              </div>
            </div>
            </div>
            <div className="container2">
              <div className="rectangle2"><img src={topTracksImages[2]} alt="Albumart1" /><div class = "topName">#3 {topTrackNames[2]}</div></div>
              <div className="rectangle2">
                <div className = "mini1">
                <div class = "smallImage"> 1 <img src={newTrackImages[10]} alt="Albumart2" />{newTrackName[10]}</div>
                <div class = "smallImage"> 2 <img src={newTrackImages[11]} alt="Albumart2" />{newTrackName[11]}</div>
                <div class = "smallImage"> 3 <img src={newTrackImages[12]} alt="Albumart2" />{newTrackName[12]}</div>
                <div class = "smallImage"> 4 <img src={newTrackImages[13]} alt="Albumart2" />{newTrackName[13]}</div>
                <div class = "smallImage"> 5 <img src={newTrackImages[14]} alt="Albumart2" />{newTrackName[14]}</div>
                </div>
              </div>
            <div className="container7">
              <div className= "rectangle7"><img src={topTracksImages[3]} alt="Albumart1" /><div class = "topName">#4 {topTrackNames[3]}</div></div>
              <div className= "rectangle7">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[15]} alt="Albumart2" />{newTrackName[15]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[16]} alt="Albumart2" />{newTrackName[16]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[17]} alt="Albumart2" />{newTrackName[17]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[18]} alt="Albumart2" />{newTrackName[18]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[19]} alt="Albumart2" />{newTrackName[19]}</div>
                </div>
              </div>
            </div>
            </div>
            <div className="container3">
              <div className="rectangle3"><img src={topTracksImages[4]} alt="Albumart1" /><div class = "topName">#5 {topTrackNames[4]}</div></div>
              <div className="rectangle3">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[20]} alt="Albumart2" />{newTrackName[20]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[21]} alt="Albumart2" />{newTrackName[21]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[22]} alt="Albumart2" />{newTrackName[22]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[23]} alt="Albumart2" />{newTrackName[23]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[24]} alt="Albumart2" />{newTrackName[24]}</div>
                </div>
              </div>
            <div className = "container8">
              <div className = "rectangle8"><img src={topTracksImages[5]} alt="Albumart1" /><div class = "topName">#6 {topTrackNames[5]}</div></div>
              <div className= "rectangle8">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[25]} alt="Albumart2" />{newTrackName[25]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[26]} alt="Albumart2" />{newTrackName[26]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[27]} alt="Albumart2" />{newTrackName[27]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[28]} alt="Albumart2" />{newTrackName[28]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[29]} alt="Albumart2" />{newTrackName[29]}</div>
                </div>
              </div>
            </div>
            </div>
            <div className="container4">
              <div className="rectangle4"><img src={topTracksImages[6]} alt="Albumart1" /><div class = "topName">#7 {topTrackNames[6]}</div></div>
              <div className="rectangle4">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[30]} alt="Albumart2" />{newTrackName[30]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[31]} alt="Albumart2" />{newTrackName[31]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[32]} alt="Albumart2" />{newTrackName[32]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[33]} alt="Albumart2" />{newTrackName[33]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[34]} alt="Albumart2" />{newTrackName[34]}</div>
                </div>
              </div>
            <div className = "container9">
              <div className = "rectangle9"><img src={topTracksImages[7]} alt="Albumart1" /><div class = "topName">#8 {topTrackNames[7]}</div></div>
              <div className = "rectangle9">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[35]} alt="Albumart2" />{newTrackName[35]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[36]} alt="Albumart2" />{newTrackName[36]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[37]} alt="Albumart2" />{newTrackName[37]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[38]} alt="Albumart2" />{newTrackName[38]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[39]} alt="Albumart2" />{newTrackName[39]}</div>
                </div>
              </div>
            </div>
            </div>
            <div className="container5">
              <div className="rectangle5"><img src={topTracksImages[8]} alt="Albumart1" /><div class = "topName">#9 {topTrackNames[8]}</div></div>
              <div className="rectangle5">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[40]} alt="Albumart2" />{newTrackName[40]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[41]} alt="Albumart2" />{newTrackName[41]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[42]} alt="Albumart2" />{newTrackName[42]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[43]} alt="Albumart2" />{newTrackName[43]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[44]} alt="Albumart2" />{newTrackName[44]}</div>
                </div>
              </div>
            <div className = "container10">
              <div className = "rectangle10"><img src={topTracksImages[9]} alt="Albumart1" /><div class = "topName">#10 {topTrackNames[9]}</div></div>
              <div className className="rectangle10">
                <div className = "mini1">
                  <div class = "smallImage"> 1 <img src={newTrackImages[45]} alt="Albumart2" />{newTrackName[45]}</div>
                  <div class = "smallImage"> 2 <img src={newTrackImages[46]} alt="Albumart2" />{newTrackName[46]}</div>
                  <div class = "smallImage"> 3 <img src={newTrackImages[47]} alt="Albumart2" />{newTrackName[47]}</div>
                  <div class = "smallImage"> 4 <img src={newTrackImages[48]} alt="Albumart2" />{newTrackName[48]}</div>
                  <div class = "smallImage"> 5 <img src={newTrackImages[49]} alt="Albumart2" />{newTrackName[49]}</div>
                </div>
              </div>
            </div>
            </div>
            <button onClick={logout}>Logout</button>

          </>
        ) : (
          <>
            <h1>Login in to get new music!</h1>
            <button onClick={handleLogin}>Login with Spotify</button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;


//have a variable thats called timeline when the user hits the button it decides which of the three it will use and set the variable
// then click add to playslist