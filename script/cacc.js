const axios = require('axios');

module.exports.config = {
  name: 'novavideo',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['tiktoktrend', 'tttrend'],
  description: "Fetch trending TikTok videos and send video attachments",
  usages: "tiktrend",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("📈 Fetching trending TikTok videos...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = 'https://betadash-api-swordslush-production.up.railway.app/tiktrend';
    const res = await axios.get(url, { timeout: 15000 });

    await api.unsendMessage(loadingMsg.messageID);

    if (!res.data || !res.data.trending || res.data.trending.length === 0) {
      return api.sendMessage("⚠️ Walang trending TikTok videos sa ngayon.", threadID);
    }

    // Take top 1 trending video (for demo)
    const video = res.data.trending[0];
    const msgText = `🎵 Trending TikTok Video:\n\n📌 ${video.title || 'No Title'}\n👤 ${video.author || 'Unknown'}\n🔗 ${video.url || 'No URL'}`;

    // Send video as attachment
    await api.sendMessage({
      body: msgText,
      attachment: await global.utils.getStreamFromURL(video.url) // convert URL to readable stream
    }, threadID);

  } catch (err) {
    console.error("[TIKTREND VIDEO ERROR]", err.response?.data || err.message);
    return api.sendMessage("❌ Error habang kino-query ang TikTrend API.", threadID);
  }
};
