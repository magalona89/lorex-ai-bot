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
  "𝙂𝙋𝙏 3.5"
];

module.exports.config = {
  name: 'messandra',
  version: '1.1.7',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gpt', 'lorex'],
  description: "An AI command powered by Gemini Vision",
  usages: "ai [prompt]",
  credits: 'LorexAi',
  cooldowns: 0
};

const bannedUsers = {}; 
const BAN_DURATION = 4 * 60 * 60 * 1000; // 4 hours in ms
const MAX_PROMPT_LENGTH = 200;
const MAX_ANSWERS = 3;

const userRequestCounts = {}; 
// Format: { userID: { count: number, lastReset: timestamp } }

async function sendTemp(api, threadID, message) {
  return new Promise(resolve => {
    api.sendMessage(message, threadID, (err, info) => resolve(info));
  });
}

function resetUserCountIfNeeded(uid) {
  const now = Date.now();
  if (!userRequestCounts[uid]) {
    userRequestCounts[uid] = { count: 0, lastReset: now };
    return;
  }
  // Reset count if lastReset more than BAN_DURATION ago
  if (now - userRequestCounts[uid].lastReset > BAN_DURATION) {
    userRequestCounts[uid] = { count: 0, lastReset: now };
  }
}

module.exports.run = async function({ api, event, args }) {
  const input = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const now = Date.now();

  // Check if banned
  if (bannedUsers[uid]) {
    if (now < bannedUsers[uid]) {
      const remaining = Math.ceil((bannedUsers[uid] - now) / (60 * 1000)); // minutes left
      return api.sendMessage(`🚫 You are temporarily banned for exceeding the allowed number of requests. Please wait ${remaining} minute(s) before trying again.`, threadID, messageID);
    } else {
      delete bannedUsers[uid]; // Ban expired
      userRequestCounts[uid] = { count: 0, lastReset: now }; // Reset count after ban
    }
  }

  resetUserCountIfNeeded(uid);

  // Check prompt length
  if (input.length > MAX_PROMPT_LENGTH) {
    bannedUsers[uid] = now + BAN_DURATION;
    return api.sendMessage(`❌ Your prompt is too long! You are now banned for 4 hours. Please limit your input to ${MAX_PROMPT_LENGTH} characters.`, threadID, messageID);
  }

  // Check answer limit
  if (userRequestCounts[uid].count >= MAX_ANSWERS) {
    bannedUsers[uid] = now + BAN_DURATION;
    return api.sendMessage(`🚫 You have reached the maximum number of ${MAX_ANSWERS} requests. You are now banned for 4 hours. Please wait before trying again.`, threadID, messageID);
  }

  const isPhotoReply = event.type === "message_reply"
    && Array.isArray(event.messageReply?.attachments)
    && event.messageReply.attachments.some(att => att.type === "photo");

  if (isPhotoReply) {
    const photoUrl = event.messageReply.attachments?.[0]?.url;
    if (!photoUrl) return api.sendMessage("❌ Could not get image URL.", threadID, messageID);
    if (!input) return api.sendMessage("📸 Please provide a prompt along with the image.", threadID, messageID);

    // Increase count for each request
    userRequestCounts[uid].count++;

    const tempMsg = await sendTemp(api, threadID, "🔍 Analyzing image...");

    try {
      const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gemini-pro', {
        params: {
          ask: input,
          uid: uid,
          imageURL: photoUrl
        }
      });

      if (data?.reply) {
        const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
        return api.editMessage(`${opener}\n\n${data.reply}`, tempMsg.messageID, threadID);
      }

      return api.editMessage("⚠️ Unexpected response from Vision API.", tempMsg.messageID, threadID);
    } catch (err) {
      console.error(err);
      return api.editMessage("❌ Error analyzing image.", tempMsg.messageID, threadID);
    }
  }

  if (!input) {
    return api.sendMessage(`🔷Hello! I am MESSANDRA, an AI assistant powered by OpenAI's GPT-4o technology. I'm here to help you with a variety of tasks, including:

- Answering questions
- Analyzing images (reply with an image + prompt)
- Helping with code, writing, ideas, and more

Send a prompt to get started!`, threadID, messageID);
  }

  // Increase count for each request
  userRequestCounts[uid].count++;

  const tempMsg = await sendTemp(api, threadID, "🔄Searching....");

  try {
    const { data } = await axios.get('https://daikyu-api.up.railway.app/api/gpt-4o', {
      params: {
        query: input,
        uid: uid
      }
    });

    if (!data?.response) {
      return api.editMessage("❌ No response received. Try again.", tempMsg.messageID, threadID);
    }

    const formatted = data.response
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, tempMsg.messageID, threadID);

  } catch (err) {
    console.error(err);
    return api.editMessage("⚠️ Something went wrong. Try again later.", tempMsg.messageID, threadID);
  }
};
