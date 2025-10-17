const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "5.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gpt5", "gpt-5"],
  description: "Chat, analyze images, reset conversation, auto react, edit messages + maintenance mode — GPT-5 PRO",
  usages: "gpt5pro [message] or reply to an image. Use 'reset' to reset conversation.\nAdmin commands: maintaince [on/off]",
  credits: "Daikyu x Grok x Meta AI",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

// Store conversation history per user
const conversationHistory = {};

// Maintenance mode flag
let maintenanceMode = false;

// Admin ID
const adminID = "61580959514473";

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;

  let query = args.join(" ").trim();
  let isImage = false;
  let imageUrl = null;

  // Admin commands for maintenance mode
  if (uid === adminID && args[0] && args[0].toLowerCase() === "maintaince") {
    const status = args[1]?.toLowerCase();
    if (status === "on") {
      maintenanceMode = true;
      return api.sendMessage("⚠️ GPT-5 PRO is now in maintenance mode. Only admin can use it.", threadID, messageID);
    } else if (status === "off") {
      maintenanceMode = false;
      return api.sendMessage("✅ GPT-5 PRO is now available for all users.", threadID, messageID);
    } else {
      return api.sendMessage("Usage: maintaince [on/off]", threadID, messageID);
    }
  }

  // Block non-admin users when maintenance mode is ON
  if (maintenanceMode && uid !== adminID) {
    return api.sendMessage("⚠️ GPT-5 PRO is currently under maintenance. Please try again later.", threadID, messageID);
  }

  // Reset conversation
  if (query.toLowerCase() === "reset") {
    conversationHistory[uid] = [];
    return api.sendMessage("♻️ GPT-5 PRO conversation reset.", threadID, messageID);
  }

  // Check if user replied to an image
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
      "🤖 GPT-5 PRO ONLINE\nAsk me anything or reply to an image for analysis.\n\nUsage: gpt5pro [your question] or reply to an image.\nType 'reset' to clear conversation.",
      threadID,
      messageID
    );
  }

  try {
    // Save conversation history
    if (!conversationHistory[uid]) conversationHistory[uid] = [];
    conversationHistory[uid].push({ role: "user", content: query });

    // React 🚀 to indicate processing
    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));

    // Send request to GPT-5 API
    const { data } = await axios.get(
      `https://daikyu-apizer-108.up.railway.app/api/gpt-5?ask=${encodeURIComponent(query)}&uid=${uid}`
    );

    const response = data.response || "⚠️ No response from GPT-5 PRO.";
    conversationHistory[uid].push({ role: "ai", content: response });

    // Remove 🚀 react
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Edit original message to show answer
    const replyText = `✨ GPT-5 PRO:\n${response}`;
    api.sendMessage(replyText, threadID, (err, info) => {
      if (err) console.error(err);
      else {
        // React 💡 to indicate ready
        api.setMessageReaction("💡", info.messageID, (err) => err && console.error(err));
      }
    });

  } catch (error) {
    console.error(error);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    return api.sendMessage(
      "❌ GPT-5 PRO is unreachable right now. Try again later.",
      threadID,
      messageID
    );
  }
};
