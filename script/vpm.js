const axios = require('axios');

const adminUID = "61580959514473";

let isUnderMaintenance = false;

module.exports.config = {
  name: 'vpn',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['convertbng', 'bngtolatlong'],
  description: "Convert BNG coordinates to latitude and longitude",
  usages: "bng2latlong [eastings] [northings] | bng2latlong maint [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(' ').trim().toLowerCase();

  // Admin maintenance toggle
  if (input.startsWith("maint")) {
    if (uid !== adminUID) {
      return api.sendMessage("⛔ Only admin can toggle maintenance.", threadID, messageID);
    }
    const toggle = args[1]?.toLowerCase();
    if (toggle === "on") {
      isUnderMaintenance = true;
      return api.sendMessage("🔧 Maintenance mode ON.", threadID, messageID);
    } else if (toggle === "off") {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode OFF.", threadID, messageID);
    } else {
      return api.sendMessage("⚙️ Usage: `bng2latlong maint on` or `bng2latlong maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 API is under maintenance. Admin only.", threadID, messageID);
  }

  if (args.length < 2) {
    return api.sendMessage("⚠️ Please provide both Eastings and Northings.\nUsage: bng2latlong [eastings] [northings]", threadID, messageID);
  }

  const eastings = args[0];
  const northings = args[1];

  const loading = await new Promise(resolve => {
    api.sendMessage(`⏳ Converting BNG (${eastings}, ${northings}) to latitude and longitude...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://api.getthedata.com/bng2latlong/${eastings}/${northings}`;

    const res = await axios.get(url);

    if (!res.data || !res.data.data) {
      return api.editMessage("⚠️ No data received from API.", loading.messageID, threadID);
    }

    const { lat, long } = res.data.data;

    const message = 
      `📍 Conversion Result:\n` +
      `Eastings: ${eastings}\n` +
      `Northings: ${northings}\n\n` +
      `Latitude: ${lat}\n` +
      `Longitude: ${long}`;

    return api.editMessage(message, loading.messageID, threadID);

  } catch (error) {
    console.error("BNG to LatLong API error:", error.message);
    return api.editMessage("❌ Failed to convert coordinates.", loading.messageID, threadID);
  }
};
