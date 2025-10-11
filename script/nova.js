const axios = require('axios');

let isUnderMaintenance = false; // 🔧 Default: OFF

const ownerUID = '61580959514473'; // ✅ Your UID

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
  version: '1.3.2',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['nova', 'gpt5', 'ai'],
  description: "GPT-5 AI with Image Analyzing via Daikyu API",
  usages: "nova [prompt] | nova maint on/off",
  credits: 'LorexAi (updated by ChatGPT)',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  const prompt = args.join(' ');

  // ✅ Maintenance toggle command (only for owner)
  if (args[0] === 'maint' && senderID === ownerUID) {
    if (args[1] === 'on') {
      isUnderMaintenance = true;
      return api.sendMessage("🛠️ Maintenance mode is now ON. Only the developer can use Nova.", threadID, messageID);
    } else if (args[1] === 'off') {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode is now OFF. Everyone can use Nova.", threadID, messageID);
    } else {
      return api.sendMessage("❓ Usage: nova maint [on/off]", threadID, messageID);
    }
  }

  // 🔒 Block users if maintenance is on and not owner
  if (isUnderMaintenance && senderID !== ownerUID) {
    return api.sendMessage("🚧 Nova AI is under maintenance. Please try again later.", threadID, messageID);
  }

  // 🧠 Normal GPT request
  let imageURL = '';

  if (!prompt && !event.messageReply) {
    return api.sendMessage("❗ Pakilagay ang iyong tanong o mag-reply sa image.", threadID, messageID);
  }

  if (event.messageReply && event.messageReply.attachments) {
    for (const attach of event.messageReply.attachments) {
      if (attach.type === 'photo' && attach.url) {
        imageURL = attach.url;
        break;
      }
    }
  }

  const loadingMsg = await new Promise(resolve => {
    const msg = loadingText[Math.floor(Math.random() * loadingText.length)];
    api.sendMessage(msg, threadID, (err, info) => resolve(info));
  });

  try {
    const { data } = await axios.get('https://daikyu-apizer-108.up.railway.app/api/gpt-5', {
      params: {
        ask: prompt || '',
        uid: senderID,
        imageURL: imageURL
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
    return api.editMessage(`❌ Error habang kinakausap ang GPT‑5 API.\n${error.message}`, loadingMsg.messageID, threadID);
  }
};

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ Error habang kinakausap ang GPT‑5 API.", loadingMsg.messageID, threadID);
  }
};
