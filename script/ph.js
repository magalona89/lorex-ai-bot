/**
 * 🇵🇭 NEWS FETCHER COMMAND (with images)
 * Author: ChatGPT Enhanced ✨
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const request = require('request');

const API_KEY = '05358f837515462181cf6398cb3b6f3f';
const COUNTRY = 'ph';
const API_URL = `https://newsapi.org/v2/top-headlines?country=${COUNTRY}&apiKey=${API_KEY}`;

module.exports.config = {
  name: 'ph',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['balita', 'headlines', 'phnews'],
  description: "Get the latest Philippine news headlines with images 🗞️",
  usages: "news",
  credits: "ChatGPT Enhanced ✨",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const thinkingMsg = await new Promise(resolve => {
      api.sendMessage("📰 Fetching the latest Philippine news...", threadID, (err, info) => resolve(info));
    });

    const response = await axios.get(API_URL);
    const articles = response.data.articles.slice(0, 5); // Show top 5 only

    await api.unsendMessage(thinkingMsg.messageID);

    if (!articles.length) {
      return api.sendMessage("⚠️ No news found at the moment.", threadID, messageID);
    }

    api.sendMessage("✅ Latest Philippine news loaded! Sending articles one by one...", threadID);

    for (const [index, article] of articles.entries()) {
      const title = article.title || "No title available";
      const source = article.source?.name || "Unknown source";
      const url = article.url || "No link available";
      const imageUrl = article.urlToImage;

      const caption = `📰 ${index + 1}. ${title}\n🗞️ Source: ${source}\n🔗 ${url}`;

      // Send image if available
      if (imageUrl) {
        try {
          const imgPath = path.join(__dirname, `tmp_news_${index}.jpg`);
          await new Promise((resolve, reject) => {
            request(imageUrl)
              .pipe(fs.createWriteStream(imgPath))
              .on('finish', resolve)
              .on('error', reject);
          });

          await api.sendMessage(
            { body: caption, attachment: fs.createReadStream(imgPath) },
            threadID
          );

          fs.unlinkSync(imgPath);
        } catch (err) {
          console.error("Image error:", err.message);
          await api.sendMessage(caption, threadID);
        }
      } else {
        await api.sendMessage(caption, threadID);
      }
    }

  } catch (error) {
    console.error("NEWS ERROR:", error.message || error);
    api.sendMessage("❌ Failed to load news. Please try again later.", threadID, messageID);
  }
};
