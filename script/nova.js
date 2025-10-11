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
  "🤖 𝗚𝗣𝗧‑𝟱",
  "✨ 𝗚𝗣𝗧‑𝟱 𝘀𝗮𝘆𝘀:",
  "📡 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗯𝘆 𝗚𝗣𝗧‑𝟱"
];

const loadingText = [
  "🤖 GPT‑5 ay nag-iisip...",
  "🧠 Pinoproseso ang iyong tanong...",
  "🔄 Kinukuha ang sagot mula sa GPT‑5...",
  "✨ Talking to the AI brain...",
  "⏳ Generating your answer..."
];

module.exports.config = {
  name: 'nova',
  version: '1.3.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['nova', 'nova'],
  description: "GPT-5 AI with Image Analyzing via Daikyu API",
  usages: "gpt5 [prompt] (reply to image to analyze)",
  credits: 'LorexAi (updated by ChatGPT)',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt && !event.messageReply) {
    return api.sendMessage("❗ Pakilagay ang iyong tanong o mag-reply sa image.", threadID, messageID);
  }

  // Check if replying to an image
  let imageURL = '';
  if (event.messageReply && event.messageReply.attachments) {
    for (const attach of event.messageReply.attachments) {
      if (attach.type === 'photo' && attach.url) {
        imageURL = attach.url;
        break;
      }
    }
  }

  const loadingMsg = await new Promise(resolve => {
    const random = loadingText[Math.floor(Math.random() * loadingText.length)];
    api.sendMessage(random, threadID, (err, info) => resolve(info));
  });

  try {
    // Call GPT-5 API with prompt and imageURL if any
    const { data } = await axios.get('https://daikyu-apizer-108.up.railway.app/api/gpt-5', {
      params: {
        ask: prompt || '',
        uid: uid,
        imageURL: imageURL // pass image url if any, else empty string
      }
    });

    const raw = data?.response || data?.result || data?.message || '';

    if (!raw) {
      return api.editMessage("⚠️ Walang natanggap na sagot mula sa GPT‑5 API.", loadingMsg.messageID, threadID);
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
    return api.editMessage("❌ Error habang kinakausap ang GPT‑5 API.", loadingMsg.messageID, threadID);
  }
};
