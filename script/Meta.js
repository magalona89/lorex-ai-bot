const axios = require("axios");

module.exports = {
  config: {
    name: "meta",
    aliases: ["meta", "llama"],
    version: "1.3",
    author: "Metaai",
    countDown: 0,
    role: 0,
    description: "Chat with Meta AI",
    category: "ai",
    guide: {
      en: "{pn} <prompt> - Ask Meta AI anything."
    }
  },

  async onStart({ message, event, args }) {
    const prompt = args.join(" ").trim();
    if (!prompt || prompt.length < 2) {
      return message.reply("❗ Please provide a question. Example:\n`llama Hello, how are you?`");
    }

    try {
      const response = await axios.get("https://arychauhann.onrender.com/api/metaai", {
        params: { prompt: encodeURIComponent(prompt) },
        timeout: 15000
      });

      if (response.data && response.data.result) {
        const formatted = response.data.result.replace(/\n{3,}/g, '\n\n');
        return message.reply(`LLAMA 4\n\n${formatted}`);
      } else {
        return message.reply("⚠️ API returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Meta AI API Error:", error.message || error);
      return message.reply("❌ Failed to get a response from Meta AI. Please try again later.");
    }
  }
};
