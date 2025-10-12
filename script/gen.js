const Bytez = require("bytez.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const adminUID = "61580959514473";
let isUnderMaintenance = false;

module.exports.config = {
  name: 'text',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['t2v', 'video'],
  description: "Generate video from text using Bytez AI",
  usages: "text2video [your description] | text2video maint [on/off]",
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
      return api.sendMessage("⚙️ Usage: `text2video maint on` or `text2video maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 Text-to-Video API is under maintenance. Admin only.", threadID, messageID);
  }

  if (!input) {
    return api.sendMessage("⚠️ Please provide a text description to generate video.\nUsage: text2video [description]", threadID, messageID);
  }

  const loading = await new Promise(resolve => {
    api.sendMessage("⏳ Generating video from text...", threadID, (err, info) => resolve(info));
  });

  try {
    const sdk = new Bytez("ec8778d6a5a1e4eaab60a0fab2616d1f");
    const model = sdk.model("ali-vilab/text-to-video-ms-1.7b");

    const { error, output } = await model.run(input);

    if (error) {
      return api.editMessage(`❌ Error: ${error}`, loading.messageID, threadID);
    }

    if (!output) {
      return api.editMessage("⚠️ No output received from the model.", loading.messageID, threadID);
    }

    // output is expected to be a video URL, download and send as attachment
    const videoUrl = output;

    // Prepare a temporary file path
    const tempFilePath = path.join(__dirname, `temp_video_${Date.now()}.mp4`);

    // Download video file
    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Send video attachment
    await api.unsendMessage(loading.messageID);
    await api.sendMessage({ 
      body: `🎬 Here's your generated video from: "${input}"`, 
      attachment: fs.createReadStream(tempFilePath) 
    }, threadID);

    // Delete temp file
    fs.unlink(tempFilePath, err => {
      if (err) console.error("Failed to delete temp video file:", err);
    });

  } catch (err) {
    console.error("Bytez text-to-video error:", err.message);
    return api.editMessage("❌ Failed to generate or send video.", loading.messageID, threadID);
  }
};
