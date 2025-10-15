const axios = require("axios");

module.exports.config = {
  name: "balita",
  version: "1.1.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["balita", "newsapi", "nt"],
  description: "Get news with images via NewsAPI.org",
  usages: "news <source or topic>\nExample: news tesla",
  credits: "Created by YourName",
  cooldowns: 0,
  dependencies: {
    axios: ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 1) {
    return api.sendMessage(
      "📰 Paki-specify ang source o topic.\nUsage: news <source or topic>\nExamples:\nnews wsj\nnews techcrunch\nnews business\nnews tesla",
      event.threadID,
      event.messageID
    );
  }

  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    return api.sendMessage(
      "⚠️ NewsAPI key is not configured.",
      event.threadID,
      event.messageID
    );
  }

  const query = args.join(" ").toLowerCase();
  let url;

  // choose endpoint based on query
  if (query === "wsj") {
    url = `https://newsapi.org/v2/everything?domains=wsj.com&apiKey=${key}`;
  } else if (query === "techcrunch") {
    url = `https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=${key}`;
  } else if (query === "business") {
    url = `https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${key}`;
  } else {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const fromString = fromDate.toISOString().split("T")[0];
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&from=${fromString}&sortBy=publishedAt&apiKey=${key}`;
  }

  api.sendMessage("⏳ Fetching latest news...", event.threadID, event.messageID);

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (data.status !== "ok" || !data.articles.length) {
      return api.sendMessage(
        "❗ Walang nahanap na balita para doon.",
        event.threadID,
        event.messageID
      );
    }

    // Get first few articles (max 3 para di flood)
    const articles = data.articles.slice(0, 3);

    for (const art of articles) {
      const title = art.title || "No title";
      const desc = art.description || "";
      const link = art.url || "";
      const img = art.urlToImage;

      let message = `📰 *${title}*\n`;
      if (desc) message += `📖 ${desc}\n`;
      if (link) message += `🔗 ${link}\n`;

      // If may image, attach it
      if (img) {
        try {
          const imgRes = await axios.get(img, { responseType: "stream" });
          api.sendMessage(
            { body: message, attachment: imgRes.data },
            event.threadID
          );
        } catch (err) {
          console.warn("Image fetch failed:", err.message);
          api.sendMessage(message, event.threadID);
        }
      } else {
        api.sendMessage(message, event.threadID);
      }
    }
  } catch (err) {
    console.error("NewsAPI error:", err.response ? err.response.data : err.message);
    api.sendMessage(
      "❌ Hindi makuha ang balita. Subukan muli mamaya.",
      event.threadID,
      event.messageID
    );
  }
};
