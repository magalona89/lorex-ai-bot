const axios = require("axios");

// Conversation & settings storage per thread
const conversationHistory = {};
const threadSettings = {};

module.exports.config = {
  name: "aria",
  version: "8.8.8.9.9.9.9",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["aria", "operaai", "askaria"],
  description: "Advanced Opera-style AI chat with interactive features.",
  usages: "aria [message]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // Initialize thread storage
  if (!conversationHistory[threadID]) conversationHistory[threadID] = [];
  if (!threadSettings[threadID]) threadSettings[threadID] = { personality: "default" };

  // No args → greeting + Ask more
  if (args.length === 0) {
    const greeting = `🤖 Hello! How can I help you today?\n\n💬 Ask more`;
    return api.sendMessage(greeting, threadID, messageID);
  }

  const prompt = args.join(" ").trim();
  if (!prompt) return api.sendMessage("❌ Please type something for Aria AI.", threadID, messageID);

  try {
    // React 🤖 while processing
    api.setMessageReaction("🤖", messageID, (err) => err && console.error(err));

    // Typing simulation
    api.sendMessage("Aria is typing...", threadID);

    // Save user message in conversation
    conversationHistory[threadID].push({ role: "user", content: prompt });

    // Send user prompt + conversation to Aria API
    const response = await axios.get("https://rapido.zetsu.xyz/api/aria", { params: { prompt } });
    const result = response.data.result || "❌ No response from Aria AI.";

    // Save AI response
    conversationHistory[threadID].push({ role: "aria", content: result });

    // Build enhanced reply
    let reply = `You asked: ${prompt}\n\nAria AI (${threadSettings[threadID].personality}):\n> ${result}\n\n💡 Quick suggestions:\n- Tell me a joke\n- Give me advice\n- What's the news?\n- Fun fact`;

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Send reply
    api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to get response from Aria AI. Try again or type !reset to clear conversation.", threadID, messageID);
  }
};

// Optional command to reset conversation per thread
module.exports.resetConversation = function(threadID) {
  if (conversationHistory[threadID]) conversationHistory[threadID] = [];
};
