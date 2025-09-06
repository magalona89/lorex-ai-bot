const axios = require('axios');

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮','b': '𝗯','c': '𝗰','d': '𝗱','e': '𝗲','f': '𝗳','g': '𝗴','h': '𝗵','i': '𝗶','j': '𝗷',
    'k': '𝗸','l': '𝗹','m': '𝗺','n': '𝗻','o': '𝗼','p': '𝗽','q': '𝗾','r': '𝗿','s': '𝘀','t': '𝘁',
    'u': '𝘂','v': '𝘃','w': '𝘄','x': '𝘅','y': '𝘆','z': '𝘇',
    'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚','H': '𝗛','I': '𝗜','J': '𝗝',
    'K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡','O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧',
    'U': '𝗨','V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭',
    '0': '𝟬','1': '𝟭','2': '𝟮','3': '𝟯','4': '𝟰','5': '𝟱','6': '𝟲','7': '𝟳','8': '𝟴','9': '𝟵',
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

function splitMessage(text, maxLength) {
  const lines = text.split('\n');
  const chunks = [];
  let chunk = '';

  for (const line of lines) {
    if ((chunk + '\n' + line).length > maxLength) {
      chunks.push(chunk);
      chunk = line;
    } else {
      chunk += (chunk ? '\n' : '') + line;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

module.exports.config = {
  name: 'meta',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['messandra', 'gpt-daikyu'],
  description: "Chat with GPT-5 (Daikyu API)",
  usages: "daikyu [prompt]",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(' ');
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!prompt) {
    return api.sendMessage("❌ Please enter a prompt.", threadID, messageID);
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🤖 Messandra GPT-5 is thinking...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://daikyu-api.up.railway.app/api/openai-gpt-5?ask=${encodeURIComponent(prompt)}&uid=${senderID}`;
    const res = await axios.get(url);

    const raw = res.data?.response;
    if (!raw || raw.trim() === '') {
      return api.editMessage("⚠️ Empty response from Daikyu API.", loadingMsg.messageID, threadID);
    }

    // 🔍 Remove lines mentioning "upload image" or similar
    const cleaned = raw
      .split('\n')
      .filter(line => !/upload (an )?image|please upload|you can upload/i.test(line))
      .join('\n');

    // 🔤 Format response
    const formatted = cleaned
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    await api.unsendMessage(loadingMsg.messageID);

    const fullMessage = `🤖 𝙈𝙀𝙎𝙎𝘼𝙉𝘿𝙍𝘼 𝗚𝗣𝗧-𝟱\n\n${formatted}`;
    const chunks = splitMessage(fullMessage, 1800);
    for (const chunk of chunks) {
      await api.sendMessage(chunk, threadID);
    }

  } catch (err) {
    console.error("Daikyu API Error:", err.message);
    return api.editMessage("❌ Error while calling Daikyu GPT-5 API.", loadingMsg.messageID, threadID);
  }
};
