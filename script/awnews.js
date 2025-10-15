const axios = require("axios");

module.exports.config = {
  name: "arianews",
  version: "1.2.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["headlines", "article", "topnews"],
  description: "Get the latest news or specific articles using the APITube News API.",
  usages: "news [everything | top | category | topic | industry | article] [query or ID]",
  credits: "Created by GPT-5",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const type = args[0];
  const query = args.slice(1).join(" ");

  if (!type) {
    return api.sendMessage(
      "📰 Usage examples:\n" +
      "• news top — get top headlines\n" +
      "• news everything apple — search all news\n" +
      "• news category sports — get by category\n" +
      "• news topic ai — get by topic\n" +
      "• news industry finance — get by industry\n" +
      "• news article 12345 — get specific article by ID",
      event.threadID,
      event.messageID
    );
  }

  api.sendMessage("⏳ Fetching news, please wait...", event.threadID, event.messageID);

  const baseUrl = "https://api.apitube.io/v1/news";
  const apiKey = process.env.APITUBE_KEY; // Store your API key in .env file

  let endpoint = "";
  let params = { apiKey };

  switch (type.toLowerCase()) {
    case "everything":
      endpoint = `${baseUrl}/everything`;
      params.q = query || "latest";
      break;

    case "top":
    case "top-headlines":
      endpoint = `${baseUrl}/top-headlines`;
      params.country = "us";
      break;

    case "category":
      endpoint = `${baseUrl}/category`;
      params.category = query || "general";
      break;

    case "topic":
      endpoint = `${baseUrl}/topic`;
      params.topic = query || "technology";
      break;

    case "industry":
      endpoint = `${baseUrl}/industry`;
      params.industry = query || "business";
      break;

    case "article":
      if (!query) {
        return api.sendMessage("⚠️ Please include an Article ID.\nExample: news article 12345", event.threadID, event.messageID);
      }
      endpoint = `${baseUrl}/article`;
      params.id = query;
      break;

    default:
      return api.sendMessage("⚠️ Invalid option. Try: top, everything, category, topic, industry, or article.", event.threadID, event.messageID);
  }

  try {
    const { data } = await axios.get(endpoint, { params });

    // === Handle single article ===
    if (type.toLowerCase() === "article") {
      if (!data || !data.article) {
        return api.sendMessage("❌ No article found with that ID.", event.threadID, event.messageID);
      }

      const article = data.article;
      let msg = `📰 ${article.title}\n\n`;
      if (article.author) msg += `✍️ Author: ${article.author}\n`;
      if (article.source?.name) msg += `🏷️ Source: ${article.source.name}\n`;
      if (article.publishedAt) msg += `📅 Published: ${article.publishedAt}\n`;
      if (article.url) msg += `🔗 Link: ${article.url}\n\n`;
      if (article.description) msg += `${article.description}\n\n`;
      if (article.content) msg += `${article.content.slice(0, 600)}...\n`;

      return api.sendMessage(msg.trim(), event.threadID, event.messageID);
    }

    // === Handle lists of articles ===
    if (!data || !data.articles || data.articles.length === 0) {
      return api.sendMessage("😕 No news found for your query.", event.threadID, event.messageID);
    }

    const articles = data.articles.slice(0, 5); // limit to top 5
    let message = `🗞️ Latest ${type.toUpperCase()} News:\n\n`;

    for (const article of articles) {
      message += `• ${article.title}\n`;
      if (article.source?.name) message += `  🏷️ Source: ${article.source.name}\n`;
      if (article.url) message += `  🔗 ${article.url}\n\n`;
    }

    api.sendMessage(message.trim(), event.threadID, event.messageID);

  } catch (error) {
    console.error("❌ Error fetching news:", error.message);
    api.sendMessage("⚠️ Error fetching news. Please check your API key or internet connection.", event.threadID, event.messageID);
  }
};
