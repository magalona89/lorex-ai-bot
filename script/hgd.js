const axios = require('axios');

const adminUID = "61580959514473";

let isUnderMaintenance = false;

module.exports.config = {
  name: 'sanbox',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['videos', 'showvideos'],
  description: "List videos from api.video sandbox",
  usages: "listvideos | listvideos maint [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(' ').trim().toLowerCase();

  // Maintenance mode toggle
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
      return api.sendMessage("⚙️ Usage: `listvideos maint on` or `listvideos maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 Video API is under maintenance. Admin only.", threadID, messageID);
  }

  const loading = await new Promise(resolve => {
    api.sendMessage("⏳ Fetching list of videos...", threadID, (err, info) => resolve(info));
  });

  try {
    const API_KEY = 'YOUR_API_VIDEO_SANDBOX_API_KEY'; // Palitan mo ito ng sandbox API key mo

    const res = await axios.get('https://sandbox.api.video/videos', {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    if (!res.data?.data || res.data.data.length === 0) {
      return api.editMessage("⚠️ Wala pang videos na nakuha.", loading.messageID, threadID);
    }

    let message = "🎬 List of Videos:\n\n";

    res.data.data.slice(0, 5).forEach((video, i) => {
      message += `${i + 1}. Title: ${video.meta.name || 'No title'}\n`;
      message += `🆔 ID: ${video.videoId}\n`;
      message += `▶️ Link: https://sandbox.api.video/videos/${video.videoId}\n\n`;
    });

    return api.editMessage(message.trim(), loading.messageID, threadID);

  } catch (error) {
    console.error("Video API error:", error.message);
    return api.editMessage("❌ Failed to fetch videos.", loading.messageID, threadID);
  }
};
