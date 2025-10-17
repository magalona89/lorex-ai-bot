const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ai",
  version: "8.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gpt5", "gpt-5"],
  description: "GPT-5 PRO ultimate: chat, image analysis, video, reset, auto react, edit, maintenance",
  usages: "gpt5pro [message], reply to image, 'video [keyword]', or 'reset'. Admin: 'maintaince [on/off]'",
  credits: "Daikyu x Grok x Meta AI",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

// Conversation history per user
const conversationHistory = {};

// Maintenance mode flag
let maintenanceMode = false;

// Admin ID
const adminID = "61580959514473";

// Helper: Send video attachment
async function sendVideoAttachment(api, threadID, messageID, videoUrl, prompt) {
  try {
    const tempPath = path.join(__dirname, `temp_video.mp4`);

    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      { body: `🎬 GPT-5 PRO Video Result:\nPrompt: ${prompt}`, attachment: fs.createReadStream(tempPath) },
      threadID,
      messageID
    );

    fs.unlinkSync(tempPath);
    api.setMessageReaction("💡", messageID, (err) => err && console.error(err));

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Failed to download or send video.", threadID, messageID);
  }
}

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;

  let query = args.join(" ").trim();
  let isImage = false;
  let imageUrl = null;

  // Admin: maintenance toggle
  if (uid === adminID && args[0]?.toLowerCase() === "maintaince") {
    const status = args[1]?.toLowerCase();
    if (status === "on") {
      maintenanceMode = true;
      return api.sendMessage("⚠️ GPT-5 PRO is now in maintenance mode. Only admin can use it.", threadID, messageID);
    } else if (status === "off") {
      maintenanceMode = false;
      return api.sendMessage("✅ GPT-5 PRO is now available for all users.", threadID, messageID);
    } else return api.sendMessage("Usage: maintaince [on/off]", threadID, messageID);
  }

  // Block non-admins if maintenance is ON
  if (maintenanceMode && uid !== adminID) {
    return api.sendMessage("⚠️ GPT-5 PRO is currently under maintenance. Please try again later.", threadID, messageID);
  }

  // Reset conversation
  if (query.toLowerCase() === "reset") {
    conversationHistory[uid] = [];
    return api.sendMessage("♻️ GPT-5 PRO conversation reset.", threadID, messageID);
  }

  // Video command
  if (args[0]?.toLowerCase() === "video") {
    const keyword = args.slice(1).join(" ");
    if (!keyword) return api.sendMessage("Usage: gpt5pro video [keyword]", threadID, messageID);

    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));

    try {
      const { data } = await axios.get(`https://rapido.zetsu.xyz/api/sora?keyword=${encodeURIComponent(keyword)}`);
      api.setMessageReaction("", messageID, (err) => err && console.error(err));

      if (!data || !data.done || !data.url) {
        return api.sendMessage(`❌ No video found for "${keyword}".`, threadID, messageID);
      }

      await sendVideoAttachment(api, threadID, messageID, data.url, data.prompt);
      return;

    } catch (error) {
      console.error(error);
      api.setMessageReaction("", messageID, (err) => err && console.error(err));
      return api.sendMessage("❌ Failed to fetch video.", threadID, messageID);
    }
  }

  // Check for image reply
  if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
    const attachment = event.messageReply.attachments[0];
    if (attachment.type === "photo") {
      isImage = true;
      imageUrl = attachment.url;
      query = "Analyze this image: " + imageUrl;
    }
  }

  if (!query) {
    return api.sendMessage(
      "🤖 GPT-5 PRO ONLINE\nAsk me anything, reply to an image, use 'video [keyword]' or type 'reset'.",
      threadID,
      messageID
    );
  }

  try {
    // Save conversation
    if (!conversationHistory[uid]) conversationHistory[uid] = [];
    conversationHistory[uid].push({ role: "user", content: query });

    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));

    // GPT-5 API request
    const { data } = await axios.get(
      `https://daikyu-apizer-108.up.railway.app/api/gpt-5?ask=${encodeURIComponent(query)}&uid=${uid}`
    );

    const response = data.response || "⚠️ No response from GPT-5 PRO.";
    conversationHistory[uid].push({ role: "ai", content: response });

    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Edit message / send response
    const replyText = `✨ GPT-5 PRO:\n${response}`;
    api.sendMessage(replyText, threadID, (err, info) => {
      if (err) console.error(err);
      else api.setMessageReaction("💡", info.messageID, (err) => err && console.error(err));
    });

  } catch (error) {
    console.error(error);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    return api.sendMessage("❌ GPT-5 PRO is unreachable right now. Try again later.", threadID, messageID);
  }
};
