const axios = require('axios');

module.exports.config = {
  name: 'llama',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Meta AI via Arychauhann API (reliable connection)",
  usages: "meta [prompt]",
  credits: "ChatGPT",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ").trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage(
      "❗ Please enter a prompt.\n\nExample:\nllama What is gravity?",
      threadID,
      messageID
    );
  }

  // Show loading indicator
  const loadingMsg = await new Promise(resolve =>
    api.sendMessage("⏳ Thinking...", threadID, (err, info) => resolve(info))
  );

  try {
    const url = `https://arychauhann.onrender.com/api/metaai?prompt=${encodeURIComponent(prompt)}`;
    const res = await axios.get(url, { timeout: 10000 });
    const answer = (res.data && res.data.response) ? res.data.response.trim() : "";

    if (!answer) {
      await api.unsendMessage(loadingMsg.messageID);
      return api.sendMessage(
        "🤖 Meta AI did not return a response. Please try again shortly.",
        threadID
      );
    }

    await api.unsendMessage(loadingMsg.messageID);
    return api.sendMessage(answer, threadID);

  } catch (err) {
    console.error("Error connecting to Meta AI API:", err.message);
    return api.editMessage(
      "❌ Connection error. Please check the API or try again later.",
      loadingMsg.messageID,
      threadID
    );
  }
};
