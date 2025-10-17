/**
 * 🌋 PHIVOLCS INFO COMMAND
 * Fetches hazard / seismic info and sends image attachments if available
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
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['hazard', 'volcano', 'quakeinfo'],
  description: "Get PHIVOLCS hazard or earthquake info by location 🌋",
  usages: "phivolcs <location>",
  credits: "ChatGPT Enhanced ✨",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const location = args.join(' ').trim();
  if (!location) {
    return api.sendMessage("⚠️ Please provide a location. Example: `phivolcs davao`", threadID, messageID);
  }

  const thinkingMsg = await new Promise(resolve => {
    api.sendMessage(`🌋 Fetching PHIVOLCS info for "${location}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `${BASE_URL}?info=${encodeURIComponent(location)}`;
    const res = await axios.get(url, { timeout: 20000 });
    const data = res.data;

    await api.unsendMessage(thinkingMsg.messageID);

    if (!data || Object.keys(data).length === 0) {
      return api.sendMessage("⚠️ No data received from PHIVOLCS API.", threadID, messageID);
    }

    // Basic info text
    let msg = `🌏 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗜𝗡𝗙𝗢 - ${location.toUpperCase()}\n\n`;

    if (data.title) msg += `📍 ${data.title}\n`;
    if (data.status) msg += `📊 Status: ${data.status}\n`;
    if (data.hazardLevel) msg += `⚠️ Hazard Level: ${data.hazardLevel}\n`;
    if (data.date) msg += `🕒 Date: ${data.date}\n`;
    if (data.message) msg += `🧭 Info: ${data.message}\n\n`;

    // Check if there is an image
    const imageUrl = data.image || data.image_url || data.img || null;

    if (imageUrl) {
      const imgPath = path.join(__dirname, `phivolcs_${Date.now()}.jpg`);
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

      fs.unlinkSync(imgPath);
    } else {
      await api.sendMessage(msg, threadID, messageID);
    }

  } catch (error) {
    console.error("PHIVOLCS ERROR:", error.response?.data || error.message);
    await api.unsendMessage(thinkingMsg.messageID);
    api.sendMessage("❌ Failed to fetch PHIVOLCS info. Please try again later.", threadID, messageID);
  }
};
