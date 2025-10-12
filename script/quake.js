const fetch = require('node-fetch');

module.exports.config = {
  name: 'ariaquake',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['earthquake', 'lindol'],
  description: "Gets the latest earthquake info from PHIVOLCS",
  usages: "phquake",
  credits: "ChatGPT + Hutchingd API",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const response = await fetch('https://hutchingd-earthquake-info-philvocs-api-cc.hf.space/info');
    const data = await response.json();

    if (!data || !data.title) {
      return api.sendMessage("⚠️ Walang nakuhang data mula sa PHIVOLCS API.", threadID, messageID);
    }

    // Construct the message
    const msg = 
`📍 *PHIVOLCS EARTHQUAKE REPORT* 📍

📅 Date & Time: ${data.datetime}
📌 Location: ${data.origin}
📏 Magnitude: ${data.magnitude}
🌊 Tsunami Info: ${data.tsunami}
📖 Report: ${data.title}

📡 Source: PHIVOLCS | Hutchingd API`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("PHIVOLCS API ERROR:", error);
    return api.sendMessage("❌ Error fetching earthquake data. Please try again later.", threadID, messageID);
  }
};
