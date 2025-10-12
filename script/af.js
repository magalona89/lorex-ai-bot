const fetch = require('node-fetch');

module.exports.config = {
  name: 'ariastock',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['pvbr', 'brainrots'],
  description: "Check stock availability of Plants vs Brainrots",
  usages: "pvbrstock",
  credits: "ChatGPT + pvbrstocktracker",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    const response = await fetch('https://plantsvsbrainrotsstocktracker.com/api/stock?since=0');
    const json = await response.json();

    if (!Array.isArray(json) || json.length === 0) {
      return api.sendMessage("⚠️ Walang stock info na nakuha mula sa PvBr API.", threadID, messageID);
    }

    let msg = "🧠 *PLANTS VS BRAINROTS STOCK TRACKER* 🌱\n\n";

    for (const item of json) {
      msg += `🟢 Product: ${item.productName}\n`;
      msg += `📦 Stock: ${item.stock}\n`;
      msg += `💵 Price: $${item.price}\n`;
      msg += `🕒 Last Updated: ${item.lastUpdated}\n\n`;
    }

    msg += "🔗 https://plantsvsbrainrotsstocktracker.com";

    return api.sendMessage(msg, threadID, messageID);

  } catch (err) {
    console.error("PvBr API Error:", err);
    return api.sendMessage("❌ Error retrieving PvBr stock data. Try again later.", threadID, messageID);
  }
};
