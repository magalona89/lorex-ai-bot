const axios = require('axios');

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
  "𝗔𝗿𝗶𝗮 𝗔𝗜 says:",
  "🤖 𝗔𝗿𝗶𝗮'𝘀 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲:",
  "💡 𝗔𝗿𝗶𝗮 𝗧𝗵𝗶𝗻𝗸𝘀:",
  "🧠 𝗔𝗿𝗶𝗮'𝘀 𝗧𝗮𝗸𝗲:"
];

module.exports.config = {
  name: 'aria2',
  version: '1.1.2',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aria', 'ariaai'],
  description: "Aria AI via BetaDash API",
  usages: "ai2 [prompt]",
  credits: 'LorexAi (Updated by ChatGPT)',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) return api.sendMessage("🫠 Please enter a prompt.", threadID, messageID);

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🔄 Loading...", threadID, (err, info) => resolve(info));
  });

  try {
    const { data } = await axios.get('https://betadash-api-swordslush-production.up.railway.app/Aria', {
      params: {
        ask: prompt,
        userid: uid,
        stream: '' // left blank as per your example
      }
    });

    const raw = data?.response || data?.message || data;

    if (!raw) {
      return api.editMessage("⚠️ No response received from Aria API.", loadingMsg.messageID, threadID);
    }

    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, loadingMsg.messageID, threadID);

  } catch (error) {
    console.error(error);
    return api.editMessage(
      `❌ Error: ${error.response?.data?.message || error.message || "Unknown error."}`,
      loadingMsg.messageID,
      threadID
    );
  }
};
