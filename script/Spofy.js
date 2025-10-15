const axios = require('axios');

module.exports.config = {
  name: 'spotify',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['play', 'spotifyplay'],
  description: "Search and play Spotify tracks with download button",
  usages: "spotify [song name]",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const query = args.join(' ').trim();

  if (!query) return api.sendMessage("❌ Pakilagay ang song title or artist.", threadID, messageID);

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🎵 Searching Spotify...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://arychauhann.onrender.com/api/spotifyplay?query=${encodeURIComponent(query)}`;
    const res = await axios.get(url, { timeout: 15000 });
    await api.unsendMessage(loadingMsg.messageID);

    if (!res.data || Object.keys(res.data).length === 0) {
      return api.sendMessage("⚠️ Walang nahanap sa Spotify.", threadID);
    }

    // Example API structure
    const track = res.data.track || res.data;

    const msg = `🎧 Spotify Result:\n\n🎵 Title: ${track.name}\n👤 Artist: ${track.artist}\n💿 Album: ${track.album || 'N/A'}`;

    // Buttons array
    const buttons = [];
    if (track.preview_url) {
      buttons.push({
        type: 'web_url',
        url: track.preview_url,
        title: '▶️ Preview / Download'
      });
    }
    if (track.spotify_url) {
      buttons.push({
        type: 'web_url',
        url: track.spotify_url,
        title: '🌐 Open in Spotify'
      });
    }

    await api.sendMessage({
      body: msg,
      attachment: null,
      buttons: buttons.length > 0 ? buttons : undefined,
      buttonType: buttons.length > 0 ? 1 : undefined
    }, threadID);

  } catch (err) {
    console.error("[SPOTIFY ERROR]", err.response?.data || err.message);
    return api.sendMessage("❌ Error habang kino-query ang Spotify API.", threadID, messageID);
  }
};
