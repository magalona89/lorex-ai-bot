const axios = require("axios");

module.exports.config = {
  name: "meta",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["metai"],
  description: "Interact with Meta AI",
  usages: "meta <your message>",
  credits: "Llma (converted by OpenAI)",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ");
  
  if (!query) {
    return api.sendMessage(
      "I'm 𝙈𝙚𝙩𝙖 𝘼𝙞, your digital companion! I'm here to assist, inform, and chat. What can I help you with today? Let's get the conversation started!",
      event.threadID,
      event.messageID
    );
  }

  try {
    const response = await axios.get(
      `https://jer-ai.gleeze.com/meta?senderid=${encodeURIComponent(event.senderID)}&message=${encodeURIComponent(query)}`
    );
    const metaResponse = response.data.response || "Meta AI didn't respond.";
    return api.sendMessage(metaResponse, event.threadID, event.messageID);
  } catch (error) {
    console.error("Meta AI error:", error);
    return api.sendMessage("❌ Error interacting with Meta AI. Try again later.", event.threadID, event.messageID);
  }
};
