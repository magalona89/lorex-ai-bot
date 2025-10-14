const axios = require('axios');

module.exports.config = {
  name: 'ytssearch',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['ytsearch', 'tube', 'searchyt'],
  description: "Search YouTube videos via Abhi API",
  usages: "ytssearch [search terms]",
  credits: 'Abhi API + LorexAi',
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length) {
    return api.sendMessage("❌ Please provide search terms. Example: `ytssearch heat waves`", threadID, messageID);
  }

  const query = args.join(' ');
  const url = `https://abhi-api.vercel.app/api/search/yts?text=${encodeURIComponent(query)}`;

  // Send loading message
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`🔍 Searching YouTube for: "${query}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const res = await axios.get(url);
    const data = res.data;

    // Depending on API response format
    const videos = data?.data || data;  // adjust if needed

    if (!videos || videos.length === 0) {
      return api.editMessage(`❌ No results found for "${query}"`, loadingMsg.messageID, threadID);
    }

    // Prepare output (take top 5)
    let text = `🎬 YouTube search results for "${query}":\n\n`;
    const limit = Math.min(5, videos.length);
    for (let i = 0; i < limit; i++) {
      const vid = videos[i];
      // typical fields: vid.title, vid.videoId, vid.thumbnail, etc.
      const title = vid.title || vid.name || "Unknown title";
      const vidId = vid.videoId || vid.id || "";
      const link = vidId ? `https://www.youtube.com/watch?v=${vidId}` : (vid.url || "No link");
      text += `${i + 1}. ${title}\n🔗 ${link}\n\n`;
    }

    await api.editMessage(text.trim(), loadingMsg.messageID, threadID);
  } catch (error) {
    console.error("ytssearch error:", error.response?.data || error.message);
    await api.editMessage("❌ Error fetching from Abhi API. Try again later.", loadingMsg.messageID, threadID);
  }
};
