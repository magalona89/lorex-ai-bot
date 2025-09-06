const axios = require('axios');

module.exports.config = {
  name: 'llama',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Meta AI via Arychauhann API (no UID, no extra formatting)",
  usages: "llama [your prompt]",
  credits: "ChatGPT",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ");
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage("❗ Please enter a prompt.\n\nExample:\nllama What is gravity?", threadID, messageID);
  }

  const loading = await new Promise(resolve =>
    api.sendMessage("⏳ Thinking...", threadID, (err, info) => resolve(info))
  );

  try {
    const url = `https://arychauhann.onrender.com/api/metaai?prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url);

    const answer = response.data?.response || "🤖 [Empty response received from Meta AI]";

    await api.unsendMessage(loading.messageID);
    return api.sendMessage(answer, threadID);
  } catch (err) {
    console.error("❌ Error from Meta API:", err.message);
    return api.editMessage("❌ Failed to get response from Meta AI.", loading.messageID, threadID);
  }
};
