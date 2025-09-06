const axios = require('axios');

module.exports.config = {
  name: 'gpt',
  version: '1.0.2',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Ask GPT-5 via Daikyu API",
  usages: "gpt [your prompt]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage(
      "🧐 Please provide a prompt. Example:\n\ngpt What is quantum physics?",
      threadID,
      messageID
    );
  }

  const loadingMessage = await new Promise(resolve =>
    api.sendMessage("⏳ Generating response from GPT-5...", threadID, (err, info) => resolve(info))
  );

  try {
    const url = `https://daikyu-api.up.railway.app/api/openai-gpt-5?ask=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url);
    const answer = response.data?.response;

    if (!answer || answer.trim() === '') {
      return api.editMessage("⚠️ No response received from GPT-5 API.", loadingMessage.messageID, threadID);
    }

    await api.unsendMessage(loadingMessage.messageID);
    return api.sendMessage(`🤖 GPT-5:\n\n${answer}`, threadID);
  } catch (err) {
    console.error("❌ API Error:", err.message);
    return api.editMessage("❌ Error while connecting to GPT-5 API.", loadingMessage.messageID, threadID);
  }
};
