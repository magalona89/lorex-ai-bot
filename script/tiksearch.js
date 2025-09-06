const axios = require('axios');

module.exports.config = {
  name: 'videosearch',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['ttsearch', 'tiktok-find'],
  description: "Search TikTok via custom API",
  usages: "tiktoksearch [query] [count]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // Parse arguments
  const query = args[0];
  let count = parseInt(args[1], 10) || 9;

  if (!query) {
    return api.sendMessage("❌ Please provide a search query. Example: `tiktoksearch funny dance 5`", threadID, messageID);
  }

  if (count < 1 || count > 50) count = 9; // limit count for safety

  const loadingMsg = await new Promise(resolve =>
    api.sendMessage("🔎 Searching TikTok...", threadID, (err, info) => resolve(info))
  );

  try {
    const url = `https://arychauhann.onrender.com/api/tiktoksearch?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await axios.get(url);
    const data = res.data;

    await api.unsendMessage(loadingMsg.messageID);

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return api.sendMessage(`⚠️ No results found for "${query}".`, threadID);
    }

    // Build message output
    let message = `TikTok Search results for **${query}**:\n\n`;
    data.results.slice(0, count).forEach((item, idx) => {
      message += `${idx + 1}. ${item.title || 'Untitled'}\n   ▶️ https://www.tiktok.com/@${item.username}/video/${item.id}\n\n`;
    });

    return api.sendMessage(message, threadID);
  } catch (error) {
    console.error("TikTok Search API error:", error.response?.data || error.message);
    return api.editMessage("❌ Error searching TikTok. Please try again later.", loadingMsg.messageID, threadID);
  }
};
