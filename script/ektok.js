const axios = require("axios");

module.exports.config = {
  name: "tiktok",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["tt", "ttsearch"],
  description: "Search TikTok videos by query.",
  usages: "tiktok [query]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const query = args.join(" ").trim();
  if (!query) return api.sendMessage("❌ Please provide a TikTok search query.", threadID, messageID);

  try {
    // React 🎵 to indicate processing
    api.setMessageReaction("🎵", messageID, (err) => err && console.error(err));

    const { data } = await axios.get("https://urangkapolka.vercel.app/api/tiktok", {
      params: { query }
    });

    if (!data || !data.no_watermark) {
      api.sendMessage("❌ No TikTok video found.", threadID, messageID);
      return;
    }

    const reply = `🎶 Title: ${data.title}\n👤 Creator: ${data.creator}\n\n💡 POWERED BY GPT-5`;

    // Send TikTok video without watermark
    api.sendMessage(
      { body: reply, attachment: await global.utils.getStreamFromURL(data.no_watermark) },
      threadID,
      messageID
    );

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to fetch TikTok video.", threadID, messageID);
  }
};
