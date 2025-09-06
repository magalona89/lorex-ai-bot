const axios = require('axios');
const fs = require('fs');
const path = require('path');

const memoryDir = path.join(__dirname, 'messandra_memory');
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

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

// Memory helper functions
const getUserMemory = (uid) => {
  const file = path.join(memoryDir, `${uid}.json`);
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file);
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
};

const saveUserMemory = (uid, history) => {
  const file = path.join(memoryDir, `${uid}.json`);
  fs.writeFileSync(file, JSON.stringify(history.slice(-10), null, 2)); // keep last 10 turns
};

const clearUserMemory = (uid) => {
  const file = path.join(memoryDir, `${uid}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
};

module.exports.config = {
  name: 'haraf',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['llama', 'ds'],
  description: "Ask Deepseek V3 AI by Kaizenji.",
  usages: "ai2 [prompt]",
  credits: 'Kaizenji + Enhanced by OpenAI',
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const uid = event.senderID;
  const input = args.join(' ').trim();

  if (!input) {
    return api.sendMessage(
      " Hi there! I'm 𝙇𝙡𝙖𝙢𝙖 4 AI, your assistant powered by 𝙈𝙚𝙩𝙖 𝘼𝙞. How can I help you today?\n\n📩 For issues, contact the owner: https://www.facebook.com/ZeromeNaval.61577040643519",
      event.threadID,
      event.messageID
    );
  }

  // Clear memory command
  if (["clear", "reset"].includes(input.toLowerCase())) {
    clearUserMemory(uid);
    return api.sendMessage("🧠 Memory cleared. I’ll forget everything from our past chats.", event.threadID, event.messageID);
  }

  api.sendMessage("⌛Generating response...", event.threadID, event.messageID);

  const history = getUserMemory(uid);
  history.push({ role: "user", content: input });

  const historyText = history.map(h => `${h.role === "user" ? "You" : "AI"}: ${h.content}`).join('\n');

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/deepseek-v3', {
      params: {
        ask: historyText,
        apikey: 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7'
      }
    });

    if (!data || !data.response) {
      return api.sendMessage("⚠️ No response from Deepseek V3. Please try again later.", event.threadID, event.messageID);
    }

    const formatted = data.response
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    // Save updated memory
    history.push({ role: "assistant", content: data.response });
    saveUserMemory(uid, history);

    return api.sendMessage(formatted, event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ Messandra error:", err.message || err);
    return api.sendMessage("⚠ Error 500: Messandra encountered a problem. Try again later.", event.threadID, event.messageID);
  }
};
