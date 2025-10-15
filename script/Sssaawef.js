const axios = require('axios');
const moment = require('moment-timezone');

module.exports.config = {
  name: 'phivolcs',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['quake', 'earthquake'],
  description: "Get latest PHIVOLCS earthquake alerts for a province",
  usages: "phivolcs [province]",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const province = args.join(' ').trim();

  if (!province) return api.sendMessage("❌ Pakilagay ang province name. Halimbawa: phivolcs Cebu", threadID);

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`🌋 Fetching PHIVOLCS alerts for ${province}...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://betadash-api-swordslush-production.up.railway.app/phivolcs?info=${encodeURIComponent(province)}`;
    const res = await axios.get(url, { timeout: 15000 });

    await api.unsendMessage(loadingMsg.messageID);

    const quake = res.data || {};
    if (!quake || Object.keys(quake).length === 0) {
      return api.sendMessage(`⚠️ Walang recent earthquake alerts sa ${province}.`, threadID);
    }

    // Philippine time formatting
    const dateTimePH = moment(quake.dateTime).tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
    const timeAgo = moment(quake.dateTime).tz("Asia/Manila").fromNow();

    const msg = `🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTimePH}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${quake.location || "Unknown"}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${quake.magnitude || "N/A"}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${quake.origin || "Unknown"}
🆔 𝗜𝗻𝗳𝗼 𝗡𝗼.: ${quake.informationNumber || "N/A"}
🔗 𝗦𝗼𝘂𝗿𝗰𝗲: ${quake.sourceUrl || "No link"}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${timeAgo} (PH Time)`;

    await api.sendMessage(msg, threadID);

  } catch (err) {
    console.error("[PHIVOLCS ERROR]", err.response?.data || err.message);
    await api.unsendMessage(loadingMsg.messageID);
    return api.sendMessage("❌ Error habang kino-query ang PHIVOLCS API.", threadID);
  }
};
