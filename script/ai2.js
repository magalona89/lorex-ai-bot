const axios = require('axios');

// Bold text converter
function convertToBold(text) {
  const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
    'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
    'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
    'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
    'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
    'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
    'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  };

  return text.split('').map(char => boldMap[char] || char).join('');
}

// Get current Philippine date and time
function getPhilippineDateTime() {
  const options = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-PH', options).format(new Date());
}

module.exports.config = {
  name: 'ai2',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['deepseek', 'ds'],
  description: "Ask Deepseek V3 AI by Kaizenji.",
  usages: "ai2 [prompt]",
  credits: 'Kaizenji',
  cooldowns: 3,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const input = args.join(' ');
  const uid = event.senderID;

  if (!input) {
    return api.sendMessage(
      "❌ Please provide a prompt",
      event.threadID,
      event.messageID
    );
  }

  api.sendMessage("🔄 Thinking...", event.threadID, event.messageID);

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/deepseek-v3', {
      params: {
        ask: input,
        apikey: 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7'
      }
    });

    if (!data || !data.response) {
      return api.sendMessage("No response from Deepseek V3. Please try again.", event.threadID, event.messageID);
    }

    const formattedResponse = data.response
      .replace(/\*\*(.*?)\*\*/g, (_, text) => convertToBold(text))
      .replace(/##(.*?)##/g, (_, text) => convertToBold(text))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    const dateTime = getPhilippineDateTime();
    const finalMessage = `🕒 ${dateTime}\n\n${formattedResponse}`;

    return api.sendMessage(finalMessage, event.threadID, event.messageID);

  } catch (error) {
    console.error("⛔ Error in Deepseek V3:", error.message || error);
    return api.sendMessage("⛔ An error occurred while processing your request. Please try again.", event.threadID, event.messageID);
  }
};
