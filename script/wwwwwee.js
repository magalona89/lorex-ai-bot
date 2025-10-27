const axios = require("axios");

module.exports.config = {
  name: "balita",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["balita", "latestnews"],
  description: "Kumuha ng pinakabagong balita gamit ang NewsData.io API.",
  usages: "news [paksa o lungsod]\nHalimbawa: news manila",
  credits: "ARIA PRO MEGA v25",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const query = args.join(" ") || "manila";
  const apiKey = "pub_f43d17a67c5340b88aede3ae65cfc961";
  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(query)}`;

  api.sendMessage(`📰 Hinahanap ang mga balita tungkol sa “${query}”...`, event.threadID, event.messageID);

  try {
    const res = await axios.get(url);
    const articles = res.data.results;

    if (!articles || articles.length === 0)
      return api.sendMessage("😔 Walang nahanap na balita para sa iyong paksa.", event.threadID, event.messageID);

    let msg = `🗞️ 𝗔𝗥𝗜𝗔 𝗡𝗘𝗪𝗦 𝗙𝗘𝗘𝗗 (${query.toUpperCase()})\n━━━━━━━━━━━━━━\n`;

    for (let i = 0; i < Math.min(5, articles.length); i++) {
      const news = articles[i];
      msg += `📰 ${i + 1}. ${news.title}\n🌐 Source: ${news.source_id}\n📅 ${news.pubDate}\n🔗 ${news.link}\n\n`;
    }

    msg += "Powered by ARIA AI 🧠 + NewsData.io 🌍";

    api.sendMessage(msg, event.threadID, event.messageID);

  } catch (error) {
    console.error("News API Error:", error.message);
    api.sendMessage("❌ May problema sa pagkuha ng balita. Subukan ulit mamaya.", event.threadID, event.messageID);
  }
};
