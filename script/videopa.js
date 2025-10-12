const Bytez = require("bytez.js");

const adminUID = "61580959514473";
let isUnderMaintenance = false;

module.exports.config = {
  name: 'textvideo',
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

    // The output is likely a URL or data string representing the video
    return api.editMessage(`🎬 Video generated from your description:\n${output}`, loading.messageID, threadID);

  } catch (err) {
    console.error("Bytez text-to-video error:", err.message);
    return api.editMessage("❌ Failed to generate video.", loading.messageID, threadID);
  }
};
