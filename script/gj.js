const axios = require('axios');

module.exports.config = {
  name: 'tiktrend',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['tiktoktrend', 'tttrend'],
  description: "Fetch trending TikTok videos",
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

    let msg = `🎵 Trending TikTok Videos:\n\n`;
    res.data.trending.forEach((video, index) => {
      msg += `📌 ${index + 1}. ${video.title || 'No Title'}\n`;
      if(video.author) msg += `👤 ${video.author}\n`;
      if(video.url) msg += `🔗 ${video.url}\n`;
      msg += '\n';
    });

    await api.sendMessage(msg, threadID);

  } catch (err) {
    console.error("[TIKTREND ERROR]", err.response?.data || err.message);
    await api.unsendMessage(loadingMsg.messageID);
    return api.sendMessage("❌ Error habang kino-query ang TikTrend API.", threadID);
  }
};
