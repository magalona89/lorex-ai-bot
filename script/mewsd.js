const axios = require('axios');

const adminUID = "61580959514473";

// Maintenance flag
let isUnderMaintenance = false;

module.exports.config = {
  name: 'news',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['manilanews', 'latestnews'],
  description: "Fetch latest news about Manila",
  usages: "news | news maint [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(' ').trim().toLowerCase();

  // Admin maintenance toggle
  if (input.startsWith("maint")) {
    if (uid !== adminUID) {
      return api.sendMessage("⛔ Only admin can toggle maintenance.", threadID, messageID);
    }
    const toggle = args[1]?.toLowerCase();
    if (toggle === "on") {
      isUnderMaintenance = true;
      return api.sendMessage("🔧 Maintenance mode ON.", threadID, messageID);
    } else if (toggle === "off") {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode OFF.", threadID, messageID);
    } else {
      return api.sendMessage("⚙️ Usage: `news maint on` or `news maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 News API is under maintenance. Admin only.", threadID, messageID);
  }

  // Loading message
  const loading = await new Promise(resolve => {
    api.sendMessage("⏳ Fetching latest news about Manila...", threadID, (err, info) => resolve(info));
  });

  try {
    const API_KEY = 'pub_f43d17a67c5340b88aede3ae65cfc961';
    const res = await axios.get('https://newsdata.io/api/1/latest', {
      params: {
        apikey: API_KEY,
        q: 'manila',
        country: 'ph',
      }
    });

    if (!res.data?.results || res.data.results.length === 0) {
      return api.editMessage("⚠️ No news found for Manila.", loading.messageID, threadID);
    }

    let message = "📰 Latest News About Manila:\n\n";

    res.data.results.slice(0, 5).forEach((article, i) => {
      message += `${i + 1}. ${article.title}\n`;
      if (article.description) message += `📝 ${article.description}\n`;
      if (article.link) message += `🔗 ${article.link}\n`;
      message += `🕒 Published: ${new Date(article.pubDate).toLocaleString()}\n\n`;
    });

    return api.editMessage(message.trim(), loading.messageID, threadID);

  } catch (error) {
    console.error("News API error:", error.message);
    return api.editMessage("❌ Failed to fetch news.", loading.messageID, threadID);
  }
};
