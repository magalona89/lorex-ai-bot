
const axios = require("axios");

const responseOpeners = [
  "LLAMA 4"
];

module.exports = {
  config: {
    name: "meta5",
    aliases: ["llama", "ai"],
    version: "1.3",
    author: "Metaai",
    countDown: 0,
    role: 0,
    description: "Chat with Meta AI (plain text response).",
    category: "ai",
    guide: {
      en: "{pn} <prompt> - Ask Meta AI anything."
    }
  },

  async onStart({ message, event, args }) {
    const prompt = args.join(" ").trim();

    if (!prompt || prompt.length < 2) {
      return message.reply(
        "Please provide a valid prompt (at least 2 characters). Example: llama Hello, how are you?"
      );
    }

    try {
      // Call the external Meta AI API with the prompt
      const response = await axios.get("https://arychauhann.onrender.com/api/metaai", {
        params: { prompt: encodeURIComponent(prompt) },
        timeout: 15000 // 15 seconds timeout
      });

      if (response.data && response.data.result) {
        // Clean extra newlines (no font conversion)
        const formatted = response.data.result.replace(/\n{3,}/g, '\n\n');

        // Pick a random opener
        const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];

        // Reply with plain AI response
        return message.reply(`${opener}\n\n${formatted}`);
      } else {
        return message.reply("❌ Unable to get a response. Please try a different prompt.");
      }
    } catch (error) {
      console.error("Meta AI API Error:", error);return message.reply("❌ Error connecting to Meta AI API. Please try again later.");
    }
  }
};
