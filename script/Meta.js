
const axios = require("axios");

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
    'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
    'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
    'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
    'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

const responseOpeners = [
  "𝙇𝙇𝘼𝙈𝘼 4"
];

module.exports = {
  config: {
    name: "llama",
    aliases: ["meta", "ai"],
    version: "1.4",
    author: "Metaai",
    countDown: 0,
    role: 0,
    description: "Chat with Meta AI (with styled response).",
    category: "ai",
    guide: {
      en: "{pn} <prompt> - Ask Meta AI anything."
    }
  },

  async onStart({ message, event, args }) {
    const prompt = args.join(" ").trim();
    if (!prompt || prompt.length < 2) {
      return message.reply("🚀 My name is Messandra Ai Powered by Llama 4 and Meta Ai how can I help you today?");
    }

    // Send loading message
    const loadingMsg = await message.reply("🔄 Loading response...");

    try {
      // Call the API with the prompt
      const response = await axios.get("https://arychauhann.onrender.com/api/metaai", {
        params: {
          prompt: encodeURIComponent(prompt)
        },
        timeout: 10000 // 10 seconds timeout for faster response
      });

      // Parse the response
      if (response.data && response.data.result) {
        const formatted = response.data.result
          .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t)) // Bold markdown
          .replace(/\n{3,}/g, '\n\n'); // Clean extra newlines
        const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
        return message.edit(`${opener}\n\n${formatted}`, loadingMsg.messageID);
      } else {
        return message.edit("❌ Unable to get a response. Please try a different prompt.", loadingMsg.messageID);
      }
    } catch (error) {
      console.error("Meta AI API Error:", error);
      return message.edit("❌ Error connecting to Meta AI API. Please try again later.", loadingMsg.messageID);
    }
  }
};
