/**
 * GPT-5 PRO Chat Module (Daikyu API Edition)
 * Author: ChatGPT Enhanced
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'gpt5pro_config.json');
const DEFAULT_API = 'https://daikyu-apizer-108.up.railway.app/api/gpt-5';
const API_TIMEOUT = 25000;
const MAX_RETRIES = 2;
const CHUNK_SIZE = 1800;

/* ------------------------ Config helpers ------------------------ */

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      maintenance: false,
      admins: [],
      api_url: DEFAULT_API,
      pro_mode: true
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    const fallback = { maintenance: false, admins: [], api_url: DEFAULT_API, pro_mode: true };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/* ------------------------ Utilities ------------------------ */

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

function splitMessage(text, maxLength = CHUNK_SIZE) {
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

/* ------------------------ Command Config ------------------------ */

module.exports.config = {
  name: 'ai',
  version: '4.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['gpt5', 'gpt5-pro', 'gem-pro'],
  description: "Chat with GPT-5 PRO (Daikyu API)",
  usages: "gpt5 [message] | gpt5 on/off | gpt5 status",
  credits: "Enhanced by ChatGPT ✨",
  cooldowns: 0
};

/* ------------------------ Main Function ------------------------ */

module.exports.run = async function({ api, event, args, Users }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  const config = loadConfig();
  const admins = config.admins.length ? config.admins : [senderID];
  const isAdmin = admins.includes(senderID);

  // Admin maintenance toggle
  const command = args[0]?.toLowerCase();
  if (['on', 'off'].includes(command)) {
    if (!isAdmin) return api.sendMessage("❌ You are not authorized to toggle maintenance.", threadID, messageID);
    config.maintenance = command === 'on';
    saveConfig(config);
    return api.sendMessage(`⚙️ GPT-5 PRO maintenance mode is now **${config.maintenance ? 'ON' : 'OFF'}**.`, threadID, messageID);
  }

  // Maintenance check
  if (config.maintenance && !isAdmin) {
    return api.sendMessage("🚧 GPT-5 PRO is currently under maintenance. Only admins can use it.", threadID, messageID);
  }

  // Message or image
  const ask = args.join(' ').trim();
  const imageUrl = event.messageReply?.attachments?.[0]?.url || '';
  if (!ask && !imageUrl) {
    return api.sendMessage("💬 Please type a question or reply to an image to ask GPT-5 PRO.", threadID, messageID);
  }

  // Thinking message
  const thinkingMsg = await new Promise(resolve => {
    api.sendMessage("🤔 GPT-5 PRO is thinking...", threadID, (err, info) => resolve(info));
  });

  // Build API URL
  const baseUrl = config.api_url || DEFAULT_API;
  const url = `${baseUrl}?ask=${encodeURIComponent(ask)}&uid=${senderID}${imageUrl ? `&image_url=${encodeURIComponent(imageUrl)}` : ''}`;

  // API request with retry logic
  let attempt = 0;
  let responseText = '';

  while (attempt <= MAX_RETRIES) {
    try {
      const res = await axios.get(url, { timeout: API_TIMEOUT });
      responseText = res.data?.response || res.data?.reply || res.data || '';
      break;
    } catch (err) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        await api.unsendMessage(thinkingMsg.messageID);
        return api.sendMessage("❌ Error: Failed to get a response from GPT-5 PRO API.", threadID);
      }
    }
  }

  await api.unsendMessage(thinkingMsg.messageID);

  if (!responseText || !responseText.toString().trim()) {
    return api.sendMessage("⚠️ No valid response from GPT-5 PRO API.", threadID);
  }

  // Format the response
  const formatted = responseText
    .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
    .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
    .replace(/\n{3,}/g, '\n\n');

  const header = imageUrl ? "🖼️ 𝗚𝗣𝗧-𝟱 𝗣𝗥𝗢 (Image Analysis)" : "🤖 𝗚𝗣𝗧-𝟱 𝗣𝗥𝗢";
  const fullReply = `${header}\n\n${formatted}`;

  const chunks = splitMessage(fullReply);
  for (const chunk of chunks) {
    await api.sendMessage(chunk, threadID);
  }
};
