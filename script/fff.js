const axios = require('axios');

const adminUID = "61580959514473";

let isUnderMaintenance = false;

module.exports.config = {
  name: 'createvideo',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['newvideo', 'uploadvideo'],
  description: "Create a new video resource on api.video sandbox",
  usages: "createvideo [title] | createvideo maint [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(' ').trim();

  // Maintenance toggle
  if (input.toLowerCase().startsWith("maint")) {
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
      return api.sendMessage("⚙️ Usage: `createvideo maint on` or `createvideo maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 Video API is under maintenance. Admin only.", threadID, messageID);
  }

  if (!input) {
    return api.sendMessage("⚠️ Please provide a title for the video.\nUsage: createvideo [title]", threadID, messageID);
  }

  const loading = await new Promise(resolve => {
    api.sendMessage(`⏳ Creating video titled "${input}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const API_KEY = 'YOUR_API_VIDEO_SANDBOX_API_KEY'; // Palitan ng sandbox API key mo

    const payload = {
      title: input,
      transcript: true,
      transcriptSummary: true,
      transcriptSummaryAttributes: ["abstract", "takeaways"]
    };

    const res = await axios.post('https://sandbox.api.video/videos', payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const video = res.data;

    const message = 
      `✅ Video Created Successfully!\n\n` +
      `🎬 Title: ${video.title}\n` +
      `🆔 Video ID: ${video.videoId}\n` +
      `📅 Created At: ${new Date(video.createdAt).toLocaleString()}\n` +
      `▶️ Player: ${video.assets?.player || 'N/A'}\n` +
      `🖼 Thumbnail: ${video.assets?.thumbnail || 'N/A'}`;

    return api.editMessage(message, loading.messageID, threadID);

  } catch (error) {
    console.error("Create Video API error:", error.response?.data || error.message);
    return api.editMessage("❌ Failed to create video.", loading.messageID, threadID);
  }
};
