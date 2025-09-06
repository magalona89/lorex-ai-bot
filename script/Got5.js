const axios = require('axios');

module.exports = {
  config: {
    name: "messandra",
    version: "1.0",
    author: "hara",
    description: "GPT-5 AI chat using Daikyu API without UID",
    usage: "gpt <message>",
  },
  async onStart({ api, args, event }) {
    const messageID = event.messageID;
    const threadID = event.threadID;
    const input = args.join(" ");

    if (!input.trim()) {
      api.sendMessage("🚀Hello there I am Messandra Ai your gateway 𝙂𝙋𝙏 5 how can I help you today?.", threadID, messageID);
      return;
    }

    const loadingMsg = await api.sendMessage("⏳ Talking to GPT-5...", threadID, messageID);

    try {
      const { data } = await axios.get("https://daikyu-api.up.railway.app/api/gpt-5", {
        params: {
          ask: input
        }
      });

      await api.unsendMessage(loadingMsg.messageID);

      if (data && data.response) {
        api.sendMessage(data.response, threadID, messageID);
      } else {
        api.sendMessage("❌ No response from GPT-5 API.", threadID, messageID);
      }
    } catch (error) {
      await api.unsendMessage(loadingMsg.messageID);
      api.sendMessage("❌ Error contacting GPT-5 API.", threadID, messageID);
      console.error(error);
    }
  }
};
