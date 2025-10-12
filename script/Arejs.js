const axios = require('axios');
const { getStatus } = require('./aria-maintenance'); // Shared maintenance state

const adminUID = "61580959514473";

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮','b': '𝗯','c': '𝗰','d': '𝗱','e': '𝗲','f': '𝗳','g': '𝗴','h': '𝗵','i': '𝗶','j': '𝗷',
    'k': '𝗸','l': '𝗹','m': '𝗺','n': '𝗻','o': '𝗼','p': '𝗽','q': '𝗾','r': '𝗿','s': '𝘀','t': '𝘁',
    'u': '𝘂','v': '𝘃','w': '𝘄','x': '𝘅','y': '𝘆','z': '𝘇',
    'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚','H': '𝗛','I': '𝗜','J': '𝗝',
    'K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡','O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧',
    'U': '𝗨','V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭',
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

const responseOpeners = [
  "🤖 𝗔𝗿𝗶𝗮 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝗱𝘀",
  "💡 𝗔𝗿𝗶𝗮 𝗧𝗵𝗶𝗻𝗸𝘀",
  "✨ 𝗙𝗿𝗼𝗺 𝗔𝗿𝗶𝗮'𝘀 𝗠𝗶𝗻𝗱",
  "📡 𝗔𝗿𝗶𝗮 𝗦𝗮𝘆𝘀"
];

module.exports.config = {
  name: 'aria1',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aria', 'ariaai'],
  description: "Ask Aria AI (with Maintenance Check)",
  usages: "aria [prompt]",
  credits: 'LorexAi | Modified by ChatGPT Pro',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;
  const prompt = args.join(' ').trim();

  // Check maintenance mode
  if (getStatus() && uid !== adminUID) {
    return api.sendMessage("🚧 𝗔𝗿𝗶𝗮 𝗔𝗜 𝗶𝘀 𝘂𝗻𝗱𝗲𝗿 𝗺𝗮𝗶𝗻𝘁𝗲𝗻𝗮𝗻𝗰𝗲.\nOnly the admin can use it right now.", threadID, messageID);
  }

  if (!prompt) {
    return api.sendMessage("❗𝗣𝗮𝗸𝗶𝗹𝗮𝗴𝗮𝘆 𝗻𝗴 𝘆𝗶𝗼𝗻𝗴 𝘀𝗮𝗴𝗼𝘁. Example: `aria Anong ibig sabihin ng AI?`", threadID, messageID);
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("⏳ 𝗔𝘀𝗸𝗶𝗻𝗴 𝗔𝗿𝗶𝗮...", threadID, (err, info) => resolve(info));
  });

  try {
    const { data } = await axios.get('https://daikyu-apizer-108.up.railway.app/api/aria-ai', {
      params: { query: prompt, uid: uid }
    });

    const raw = data?.response;
    if (!raw) {
      return api.editMessage("⚠️ 𝗡𝗼 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗿𝗲𝗰𝗲𝗶𝘃𝗲𝗱 𝗳𝗿𝗼𝗺 𝗔𝗿𝗶𝗮 API.", loadingMsg.messageID, threadID);
    }

    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, loadingMsg.messageID, threadID);

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ 𝗘𝗿𝗿𝗼𝗿 𝗰𝗼𝗻𝘁𝗮𝗰𝘁𝗶𝗻𝗴 𝗔𝗿𝗶𝗮 𝗔𝗣𝗜.", loadingMsg.messageID, threadID);
  }
};
