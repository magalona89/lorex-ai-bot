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

const responseOpeners = ["𝙇𝙇𝘼𝙈𝘼 4"];

module.exports = {
  config: {
    name: "llama",
    version: "1.3.1",
    author: "MetaAI",
    countDown: 0,
    role: 0,
    aliases: ["meta", "llama"],
    description: "Chat with Meta AI (LLAMA 4 via API)",
    category: "ai",
    guide: {
      en: "{pn} <your message>\nAsk LLAMA 4 anything."
    }
  },

  async onStart({ message, args }) {
    const prompt = args.join(" ").trim();
    if (!prompt || prompt.length < 2) {
      return message.reply("❗ Please provide a valid prompt. Example:\n`llama What is the capital of Japan?`");
    }

    const thinking = await message.reply("⏳ Connecting to LLAMA 4...");

    try {
      const { data } = await axios.get("https://arychauhann.onrender.com/api/metaai", {
        params: { prompt },
        timeout: 15000
      });

      // Log for inspection
      console.log("LLAMA API Response:", JSON.stringify(data));

      // Attempt to gather answer from possible keys
      let responseText = 
        data.result ||
        data.response ||
        data.message ||
        (data.data && typeof data.data === "string" && data.data) ||
        "";

      responseText = responseText.trim();

      if (!responseText) {
        return message.reply("⚠️ Meta AI returned an empty response. Please rephrase your prompt.");
      }

      const formatted = responseText
        .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
        .replace(/\n{3,}/g, "\n\n");

      const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
      return message.reply(`${opener}\n\n${formatted}`);

    } catch (err) {
      console.error("[LLAMA API ERROR]:", err.message);
      return message.reply("❌ Failed to connect to LLAMA AI. Please try again later.");
    }
  }
};
