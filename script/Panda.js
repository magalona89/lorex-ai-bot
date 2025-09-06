const axios = require('axios');

module.exports = {
  config: {
    name: "panda",
    version: "1.0",
    author: "hara",
    description: "Panda AI chat command using Kaiz API",
    usage: "panda <message>",
  },
  async onStart({ api, args, event }) {
    const ID = event.messageID;
    const threadID = event.threadID;
    const input = args.join(" ");

    if (!input || input.trim() === "") {
      api.sendMessage("💬 | Please provide a message.", threadID, ID);
      return;
    }

    const loading = await api.sendMessage("⏳ | Talking to Panda AI...", threadID, ID);

    try {
      const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/panda-ai', {
        params: {
          ask: input,
          uid: '1',
          apikey: '5ce15f34-7e46-4e7e-8ee7-5e934afe563b'
        }
      });

      await api.unsendMessage(loading.messageID);

      if (data && data.response) {
        api.sendMessage(data.response, threadID, ID);
      } else if (typeof data === 'string') {
        api.sendMessage(data, threadID, ID);
      } else {
        api.sendMessage("❌ No response from Panda AI API.", threadID, ID);
      }
    } catch (error) {
      await api.unsendMessage(loading.messageID);
      api.sendMessage("❌ Error contacting Panda AI API.", threadID, ID);
      console.error(error);
    }
  }
};
