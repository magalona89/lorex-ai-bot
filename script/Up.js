const axios = require('axios');

module.exports.config = {
  name: 'uptime',
  version: '1.0.3',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['status', 'monitor'],
  description: "Check if the AI system is online and how long it's been up",
  usages: "uptime",
  credits: 'OpenAI x You',
  cooldowns: 5
};

// URL to check
const aiServiceURL = 'https://messandra-ai.onrender.com';

// Store start time (in memory)
let lastOnlineTime = null;

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const start = Date.now();

  try {
    await axios.get(aiServiceURL, { timeout: 7000 });
    const end = Date.now();
    const responseTime = end - start;

    // First time it's detected online
    if (!lastOnlineTime) {
      lastOnlineTime = Date.now();
    }

    const uptime = formatDuration(Date.now() - lastOnlineTime);

    const msg = `🟢 𝗔𝗜 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝘁𝗶𝗺𝗲\n━━━━━━━━━━━━━━━\n✅ Status: Online\n⏱️ Response Time: ${responseTime}ms\n⏳ Uptime: ${uptime}\n📅 Checked: ${new Date().toLocaleString()}`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    // If offline, reset uptime tracker
    lastOnlineTime = null;

    const msg = `🔴 𝗔𝗜 𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝘁𝗶𝗺𝗲\n━━━━━━━━━━━━━━━\n❌ Status: Offline or Not Responding\n⚠️ Error: ${err.code || 'Timeout/Error'}\n📅 Checked: ${new Date().toLocaleString()}`;

    return api.sendMessage(msg, threadID, messageID);
  }
};

// Convert ms → h m s
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}
