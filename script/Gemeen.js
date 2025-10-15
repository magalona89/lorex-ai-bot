const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'gemini_config.json');

// Load or initialize config
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ maintenance: false, admins: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/* ----------------------------- Helper Functions ---------------------------- */

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

/* ------------------------------ Command Config ----------------------------- */

module.exports.config = {
  name: 'nika',
  version: '3.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gem', 'gem-ai', 'geminichat'],
  description: "Chat with Gemini AI (Pro + Maintenance Mode)",
  usages: "gemini [message] | gemini on/off (admin)",
  credits: "Enhanced by ChatGPT ✨",
  cooldowns: 0
};

/* ------------------------------ Main Function ------------------------------ */

module.exports.run = async function({ api, event, args, Users }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  const config = loadConfig();
  const admins = config.admins.length ? config.admins : [senderID]; // default first sender as admin

  // ------------------ Admin Commands ------------------
  const command = args[0]?.toLowerCase();
  if (['on', 'off'].includes(command)) {
    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Hindi ka authorized na mag-toggle ng Gemini maintenance.", threadID, messageID);
    }
    config.maintenance = command === 'off' ? false : true;
    saveConfig(config);
    return api.sendMessage(`✅ Gemini maintenance mode ay **${config.maintenance ? 'ON' : 'OFF'}**.`, threadID, messageID);
  }

  // ------------------ Maintenance Mode Check ------------------
  if (config.maintenance && !admins.includes(senderID)) {
    return api.sendMessage("⚠️ Gemini ay kasalukuyang nasa maintenance mode. Tanging admin lang ang makakagamit.", threadID, messageID);
  }

  // ------------------ Gemini AI Processing ------------------
  const ask = args.join(' ').trim();
  const imageUrl = event.messageReply?.attachments?.[0]?.url || '';
  if (!ask && !imageUrl) {
    return api.sendMessage("💬 Pakitype ang tanong o mag-reply sa larawan para tanungin si Gemini.", threadID, messageID);
  }

  const thinkingMsg = await new Promise(resolve => {
    api.sendMessage("🤔 Gemini AI is analyzing your request...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://gemini-web-api.onrender.com/gemini?ask=${encodeURIComponent(ask)}&uid=${senderID}&image_url=${encodeURIComponent(imageUrl || '')}`;
    const response = await axios.get(url, { timeout: 25000 });
    let raw = response.data?.response || response.data?.reply || response.data || '';

    if (!raw.trim()) {
      await api.unsendMessage(thinkingMsg.messageID);
      return api.sendMessage("⚠️ Walang valid na sagot mula sa Gemini API.", threadID);
    }

    const formatted = raw
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n');

    await api.unsendMessage(thinkingMsg.messageID);

    const header = imageUrl 
      ? "🖼️ 𝙂𝙀𝙈𝙄𝙉𝙄 𝘼𝙄 (Image Analysis)"
      : "🤖 𝙂𝙀𝙈𝙄𝙉𝙄 𝘼𝙄";

    const fullReply = `${header}\n\n${formatted}`;
    const chunks = splitMessage(fullReply);

    for (const chunk of chunks) {
      await api.sendMessage(chunk, threadID);
    }

  } catch (error) {
    console.error(`[GEMINI PRO ERROR - ${senderID}]:`, error.response?.data || error.message);

    await api.unsendMessage(thinkingMsg.messageID);
    const msg = (error.code === 'ECONNABORTED')
      ? "⌛ Lumagpas sa oras ang koneksyon. Subukan muli mamaya."
      : "❌ Nagkaroon ng error habang kumakausap kay Gemini. Pakisubukan ulit.";
      
    return api.sendMessage(msg, threadID);
  }
};
