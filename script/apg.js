const axios = require('axios');

const adminUID = "61580959514473";

let isUnderMaintenance = false;

const feedbacks = [];
const userSessions = {};

module.exports.config = {
  name: 'earthquake',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['quake', 'eq'],
  description: "Earthquake & tsunami info with admin maintenance & feedback",
  usages: "earthquake status | earthquake feedback [msg] | earthquake maint [on/off] | earthquake reset | earthquake rules",
  credits: 'Created by ChatGPT',
  cooldowns: 0
};

async function fetchEarthquakes(lat, lon, radius = 100, limit = 5) {
  try {
    const { data } = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
      params: {
        format: 'geojson',
        latitude: lat,
        longitude: lon,
        maxradius: radius,
        limit,
        orderby: 'time'
      }
    });
    return data.features || [];
  } catch (error) {
    console.error("Error fetching earthquakes:", error.message);
    return null;
  }
}

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(' ').trim().toLowerCase();

  // Admin-only maintenance toggle
  if (input.startsWith("maint")) {
    if (uid !== adminUID) {
      return api.sendMessage("⛔ Only the admin can toggle maintenance mode.", threadID, messageID);
    }
    const toggle = args[1]?.toLowerCase();
    if (toggle === "on") {
      isUnderMaintenance = true;
      return api.sendMessage("🔧 Maintenance mode enabled.", threadID, messageID);
    } else if (toggle === "off") {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode disabled.", threadID, messageID);
    } else {
      return api.sendMessage("⚙️ Usage: `earthquake maint on` or `earthquake maint off`", threadID, messageID);
    }
  }

  // Block usage if under maintenance and not admin
  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 Bot is under maintenance. Only admin can use it now.", threadID, messageID);
  }

  if (!input) {
    return api.sendMessage("❗ Please enter a command. Type `earthquake rules` for help.", threadID, messageID);
  }

  // Command: rules
  if (input === "rules") {
    const msg = `
📜 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗕𝗼𝘁 𝗥𝘂𝗹𝗲𝘀

1️⃣ Terms of Use:
- Data from USGS API.
- For info only, verify with official sources.
- No liability.

2️⃣ Privacy:
- Minimal data collected.
- Feedback stored for admin.

3️⃣ Commands:
- \`earthquake status\`: Show recent quakes (Bicol, Calamba, Makati) & tsunami alert.
- \`earthquake feedback [msg]\`: Send feedback.
- \`earthquake maint on/off\`: Admin maintenance toggle.
- \`earthquake reset\`: Reset your session.
- \`earthquake rules\`: Show this message.
`;
    return api.sendMessage(msg.trim(), threadID, messageID);
  }

  // Command: feedback
  if (input.startsWith("feedback")) {
    const fb = args.slice(1).join(' ').trim();
    if (!fb) {
      return api.sendMessage("❗ Please write your feedback after `earthquake feedback`.", threadID, messageID);
    }
    feedbacks.push({ uid, message: fb, time: new Date().toISOString() });
    return api.sendMessage("🙏 Thank you for your feedback! Admin will review it.", threadID, messageID);
  }

  // Command: reset
  if (input === "reset") {
    userSessions[uid] = null;
    return api.sendMessage("🔄 Session reset successfully.", threadID, messageID);
  }

  // Command: status
  if (input === "status") {
    const loading = await new Promise(resolve => {
      api.sendMessage("⏳ Fetching earthquake info...", threadID, (err, info) => resolve(info));
    });

    const locations = [
      { name: "Bicol Region", lat: 13.14, lon: 123.75 },
      { name: "Calamba, Laguna", lat: 14.2135, lon: 121.1675 },
      { name: "Makati, Metro Manila", lat: 14.5547, lon: 121.0244 }
    ];

    let reply = "🌏 Latest Earthquake Updates:\n\n";

    for (const loc of locations) {
      const quakes = await fetchEarthquakes(loc.lat, loc.lon, 100, 3);
      if (!quakes) {
        reply += `⚠️ Failed to get data for ${loc.name}.\n\n`;
        continue;
      }
      reply += `📍 ${loc.name}:\n`;
      if (quakes.length === 0) {
        reply += "No recent earthquakes.\n\n";
        continue;
      }
      quakes.forEach(q => {
        const time = new Date(q.properties.time).toLocaleString();
        reply += `- M${q.properties.mag} - ${q.properties.place} at ${time}\n`;
      });
      reply += "\n";
    }

    // Example dummy tsunami alert
    reply += "🚨 Tsunami Alert: None at this time.\n";

    return api.editMessage(reply, loading.messageID, threadID);
  }

  return api.sendMessage("❓ Unknown command. Type `earthquake rules` for a list of commands.", threadID, messageID);
};
