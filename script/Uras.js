const axios = require("axios");
const fs = require("fs");
const path = require("path");

// === CONFIGURATION ===
module.exports.config = {
  name: "uras",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["text2video_ultra", "vidultra"],
  description: "Generate a realistic video using Modelslab text2video_ultra API.",
  usages: "ultra [prompt]",
  credits: "Created by GPT-5",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

// === MAIN FUNCTION ===
module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage(
      "🎬 Please provide a prompt for the video.\nExample: ultra a futuristic city with flying cars at night",
      event.threadID,
      event.messageID
    );
  }

  api.sendMessage("⏳ Generating your video... please wait.", event.threadID, event.messageID);

  // === API Request Body ===
  const requestBody = {
    prompt,
    portrait: true,
    resolution: "480",
    fps: "18",
    num_frames: "92",
    output_type: "mp4",
    model_id: "wan2.2",
    negative_prompt:
      "blurry, low quality, distorted, extra limbs, missing limbs, broken fingers, deformed, glitch, artifacts, unrealistic, low resolution, bad anatomy, duplicate, cropped, watermark, text, logo, jpeg artifacts, noisy, oversaturated, underexposed, overexposed, flicker, unstable motion, motion blur, stretched, mutated, out of frame, bad proportions",
    key: process.env.MODELSLAB_KEY || "YOUR_API_KEY_HERE" // 🔒 ilagay sa .env mo
  };

  try {
    const response = await axios.post(
      "https://modelslab.com/api/v6/video/text2video_ultra",
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data && response.data.video_url) {
      api.sendMessage(
        `✅ Video generated successfully!\n🎥 Watch or download here:\n${response.data.video_url}`,
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        "⚠️ Request sent successfully but no video URL received yet. Try again later.",
        event.threadID,
        event.messageID
      );
    }

  } catch (error) {
    console.error("❌ Error generating video:", error.message);
    api.sendMessage(
      "⚠️ Error: Failed to generate video. Please check your API key or prompt.",
      event.threadID,
      event.messageID
    );
  }
};
