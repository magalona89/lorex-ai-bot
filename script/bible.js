const axios = require("axios");

module.exports.config = {
  name: "bible",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["verse", "bibleverse"],
  description: "Get a Bible verse using the Bible API.",
  usages: "bible [Book Chapter:Verse]\nExample: bible John 3:16",
  credits: "Created by GPT-5",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ").trim();

  if (!query) {
    return api.sendMessage(
      "📖 Please provide a Bible reference.\nExample: bible John 3:16",
      event.threadID,
      event.messageID
    );
  }

  const formattedQuery = query.replace(/\s+/g, "+");
  const url = `https://bible-api.com/${formattedQuery}`;

  api.sendMessage("⏳ Fetching Bible verse...", event.threadID, event.messageID);

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (!data.text) {
      return api.sendMessage("⚠️ Verse not found. Please check your input.", event.threadID, event.messageID);
    }

    const message =
      `📖 ${data.reference}\n\n` +
      `${data.text.trim()}\n\n` +
      `📚 Translation: ${data.translation_name} (${data.translation_id.toUpperCase()})`;

    api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error("Bible API error:", error.message);
    api.sendMessage("❌ Unable to fetch Bible verse. Please try again later.", event.threadID, event.messageID);
  }
};
