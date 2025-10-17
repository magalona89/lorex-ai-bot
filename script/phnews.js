/**
 * 🇵🇭 NEWS FETCHER COMMAND (Powered by NewsAPI.org)
 * Author: ChatGPT Enhanced ✨
 */

const axios = require('axios');

const API_KEY = '05358f837515462181cf6398cb3b6f3f';
const COUNTRY = 'ph';
const API_URL = `https://newsapi.org/v2/top-headlines?country=${COUNTRY}&apiKey=${API_KEY}`;

module.exports.config = {
  name: 'phnews',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['balita', 'headlines', 'phnews'],
  description: "Get the latest Philippine news headlines 🗞️",
  usages: "news",
  credits: "ChatGPT Enhanced ✨",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const thinkingMsg = await new Promise(resolve => {
      api.sendMessage("🗞️ Fetching the latest Philippine headlines...", threadID, (err, info) => resolve(info));
    });

    const response = await axios.get(API_URL);
    const articles = response.data.articles.slice(0, 5); // Show top 5 headlines

    if (!articles.length) {
      await api.unsendMessage(thinkingMsg.messageID);
      return api.sendMessage("⚠️ No news articles found right now.", threadID, messageID);
    }

    let msg = "🇵🇭 𝗧𝗢𝗣 𝗛𝗘𝗔𝗗𝗟𝗜𝗡𝗘𝗦 𝗜𝗡 𝗧𝗛𝗘 𝗣𝗛𝗜𝗟𝗜𝗣𝗣𝗜𝗡𝗘𝗦 📰\n\n";
    articles.forEach((a, i) => {
      msg += `📍 ${i + 1}. ${a.title}\n`;
      if (a.source?.name) msg += `🗞️ Source: ${a.source.name}\n`;
      if (a.url) msg += `🔗 Link: ${a.url}\n\n`;
    });

    await api.unsendMessage(thinkingMsg.messageID);
    api.sendMessage(msg.trim(), threadID, messageID);

  } catch (error) {
    console.error('NEWS COMMAND ERROR:', error.message || error);
    api.sendMessage("❌ Failed to fetch news. Please try again later.", threadID, messageID);
  }
};
