const axios = require("axios");

const responseOpeners = [
  "LLAMA 4"
];

module.exports = {
  config: {
    name: "meta",
    aliases: ["llama", "ai"],
    version: "1.3",
    author: "Metaai",
    countDown: 0,
    role: 0,
    description: "Chat with Meta AI (plain response).",
    category: "ai",
    guide: {
      en: "{pn} <prompt> - Ask Meta AI anything."
    }
  },

  async onStart({ message, event, args }) {
    const prompt = args.join(" ").trim();

    if (!prompt || prompt.length < 2) {
      return message.reply("Please provide a valid prompt (at least 2 characters). Example: llama Hello, how are you?");
    }

    try {
      const response = await axios.get("https://arychauhann.onrender.com/api/metaai", {
        params: {
          prompt: prompt
        },
        timeout: 15000
      });

      if (response.data && response.data.result) {
        const formatted = response.data.result.replace(/\n{3,}/g, '\n\n');
        const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
        return message.reply(`${opener}\n\n${formatted}`);
      } else {
        return message.reply("❌ Unable to get a valid response from the API.");
      }
    } catch (error) {
      console.error("Meta AI API Error:", error.message || error);
      return message.reply("❌ Error connecting to Meta AI API. Please try again later.");
    }
  }
};
