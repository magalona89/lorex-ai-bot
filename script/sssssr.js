const axios = require('axios');

module.exports.config = {
  name: 'news5',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['headlines', 'breakingnews'],
  description: "Get top news using Apiverve News API",
  usages: "news [topic/category]",
  credits: 'Apiverve + LorexAi',
  cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const query = args.join(' ') || 'general';

  const loading = await new Promise((resolve) => {
    api.sendMessage(`🗞 Searching news5 for "${query}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const response = await axios.get(`https://api.apiverve.com/v1/news`, {
      params: {
        q: query
      },
      headers: {
        'x-api-key': 'a29d203e-811c-4821-b6ae-7ca65bc6fd0c'
      }
    });

    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      return api.editMessage(`❌ No news found for "${query}".`, loading.messageID, threadID);
    }

    let msg = `📰 Top News5 for "${query}":\n`;

    articles.slice(0, 5).forEach((article, index) => {
      msg += `\n${index + 1}. ${article.title}\n🌐 ${article.url}\n`;
    });

    return api.editMessage(msg, loading.messageID, threadID);

  } catch (err) {
    console.error(err);
    return api.editMessage("❌ Error fetching news. Try again later.", loading.messageID, threadID);
  }
};
