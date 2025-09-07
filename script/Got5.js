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
  return text.split('').map(c => boldMap[c] || c).join('');
}

function splitMessage(text, maxLength = 1800) {
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
  name: 'messandra',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['messandra', 'daikyu-gpt5'],
  description: "Chat with GPT‑5 via Daikyu API",
  usages: "daikyu5 [your prompt]",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ').trim();
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!prompt) {
    return api.sendMessage("❌ Paki‑type ang prompt mo.", threadID, messageID);
  }

  const loadingInfo = await new Promise(resolve => {
    api.sendMessage("⏳ GPT‑5 is thinking...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://daikyu-api.up.railway.app/api/gpt-5?ask=${encodeURIComponent(prompt)}&uid=${senderID}`;
    const res = await axios.get(url);

    const raw = res.data?.response || res.data?.reply || '';
    if (!raw.trim()) {
      return api.editMessage("⚠️ Walang sagot mula sa Daikyu GPT‑5 API.", loadingInfo.messageID, threadID);
    }

    // Optional: filter out unwanted lines (e.g., upload image suggestions)
    const cleaned = raw
      .split('\n')
      .filter(line => !/upload (an )?image|please upload|you can upload/i.test(line))
      .join('\n');

    const formatted = cleaned
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    await api.unsendMessage(loadingInfo.messageID);

    const header = `🤖 𝗚𝗣𝗧‑𝟱\n\n`;
    const messageChunks = splitMessage(header + formatted);

    for (const chunk of messageChunks) {
      await api.sendMessage(chunk, threadID);
    }

  } catch (error) {
    console.error("Error calling GPT‑5 API:", error.response?.data || error.message);
    return api.editMessage("❌ May error habang kumokonekta sa GPT‑5 API.", loadingInfo.messageID, threadID);
  }
};
