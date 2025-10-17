/**
 * 🌋 PHIVOLCS EARTHQUAKE / HAZARD INFO COMMAND
 * Fetches data from your PHIVOLCS API and sends image map if available.
 * API: https://betadash-api-swordslush-production.up.railway.app/phivolcs?info=<location>
 * Author: ChatGPT Enhanced ✨
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const request = require('request');

const BASE_URL = 'https://betadash-api-swordslush-production.up.railway.app/phivolcs';

module.exports.config = {
  name: 'dost',
  version: '3.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['earthquake', 'hazard', 'volcano'],
  description: "Get PHIVOLCS earthquake or hazard info (with map image support) 🌋",
  usages: "phivolcs <location>",
  credits: "ChatGPT Enhanced ✨",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const location = args.join(' ').trim();
  if (!location) {
    return api.sendMessage("⚠️ Please provide a location. Example: `phivolcs davao`", threadID, messageID);
  }

  const thinkingMsg = await new Promise(resolve => {
    api.sendMessage(`📡 Fetching PHIVOLCS earthquake data for "${location}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `${BASE_URL}?info=${encodeURIComponent(location)}`;
    const response = await axios.get(url, { timeout: 20000 });
    const data = response.data;

    await api.unsendMessage(thinkingMsg.messageID);

    if (!data || Object.keys(data).length === 0) {
      return api.sendMessage("⚠️ No data received from PHIVOLCS API.", threadID, messageID);
    }

    // 🧠 Format message
    let msg = `🌏 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗜𝗻𝗳𝗼\n`;
    msg += `📍 Location: ${location.toUpperCase()}\n\n`;

    if (data.title) msg += `🧭 ${data.title}\n`;
    if (data.magnitude) msg += `💥 Magnitude: ${data.magnitude}\n`;
    if (data.depth) msg += `🌊 Depth: ${data.depth}\n`;
    if (data.time) msg += `🕒 Time: ${data.time}\n`;
    if (data.status) msg += `📊 Status: ${data.status}\n`;
    if (data.message) msg += `📖 Info: ${data.message}\n`;

    // 🔍 Detect image field
    const imageUrl = data.image || data.map || data.image_url || data.img || null;

    if (imageUrl) {
      const imgPath = path.join(__dirname, `phivolcs_map_${Date.now()}.jpg`);
      await new Promise((resolve, reject) => {
        request(imageUrl)
          .pipe(fs.createWriteStream(imgPath))
          .on('finish', resolve)
          .on('error', reject);
      });

      await api.sendMessage(
        { body: msg, attachment: fs.createReadStream(imgPath) },
        threadID
      );

      fs.unlinkSync(imgPath); // delete after sending
    } else {
      await api.sendMessage(msg, threadID, messageID);
    }

  } catch (error) {
    console.error("PHIVOLCS ERROR:", error.response?.data || error.message);
    await api.unsendMessage(thinkingMsg.messageID);
    api.sendMessage("❌ Failed to fetch PHIVOLCS data. Please try again later.", threadID, messageID);
  }
};
