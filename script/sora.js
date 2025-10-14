const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sora",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["videoai", "generatevideo"],
  description: "Generate a video using Sora (AIMLAPI)",
  usages: "sora <prompt>",
  credits: "OpenAI Converted",
  cooldowns: 0,
  dependencies: {
    "axios": "",
    "fs": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ");
  const apiKey = "74a02abfccdb409f9bd5963480285f65"; // 🔐 Replace this if regenerated
  const baseUrl = "https://api.aimlapi.com/v2/video/generations";

  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt to generate a video.\n\nExample:\nsora A dancing robot in Tokyo city at night", event.threadID, event.messageID);
  }

  try {
    api.setMessageReaction("🎬", event.messageID, () => {}, true);

    // Step 1: Send request to generate video
    const generation = await axios.post(baseUrl, {
      model: "openai/sora-2-t2v",
      prompt: prompt,
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const result = generation.data;

    if (!result || !result.url) {
      return api.sendMessage("❌ Failed to generate video. Try again later.", event.threadID, event.messageID);
    }

    const videoUrl = result.url;

    // Step 2: Download the video
    const videoPath = path.join(__dirname, "cache", `sora_${Date.now()}.mp4`);
    const videoRes = await axios.get(videoUrl, { responseType: "arraybuffer" });

    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.writeFileSync(videoPath, videoRes.data);

    // Step 3: Send video to user
    api.setMessageReaction("✅", event.messageID, () => {}, true);
    api.sendMessage({
      body: "📽️ Here's your Sora-generated video:",
      attachment: fs.createReadStream(videoPath)
    }, event.threadID, () => {
      // Delete file after sending
      setTimeout(() => {
        fs.unlink(videoPath, err => {
          if (err) console.error("Failed to delete video file:", err);
        });
      }, 10000);
    });

  } catch (error) {
    console.error("Sora generation error:", error?.response?.data || error.message);
    return api.sendMessage("❌ Error occurred while generating video.", event.threadID, event.messageID);
  }
};
