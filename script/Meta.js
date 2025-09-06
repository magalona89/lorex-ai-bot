const axios = require('axios');

module.exports.config = {
  name: 'metaai',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['meta', 'llama'],
  description: "Meta AI via arychauhann API",
  usages: "metaai [prompt]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage(
      "🌟 Hi! I'm Meta AI. Please enter your prompt after the command.",
      threadID,
      messageID
    );
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🔄 Processing your request...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://arychauhann.onrender.com/api/metaai?ask=${encodeURIComponent(prompt)}&uid=${uid}`;
    const { data } = await axios.get(url);

    const raw = data?.response;
    if (!raw || raw.trim() === '') {
      return api.editMessage("⚠️ Walang natanggap na sagot mula sa Meta AI.", loadingMsg.messageID, threadID);
    }

    await api.unsendMessage(loadingMsg.messageID);

    await api.sendMessage(`🤖 Meta AI:\n\n${raw}`, threadID);

  } catch (error) {
    console.error("❌ Meta AI API Error:", error.message);
    return api.editMessage("❌ Error habang kumokonekta sa Meta AI API.", loadingMsg.messageID, threadID);
  }
};
