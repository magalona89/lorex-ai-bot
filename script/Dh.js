const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "soravideo",
  version: "2.1.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["soraai", "genvideo"],
  description: "Generate video using CometAPI (with polling)",
  usages: "cometvideo <prompt>",
  credits: "OpenAI + CometAPI",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs": "",
    "path": "",
    "form-data": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(" ");
  const apiKey = "sk-2OH246bUZjsaQUwl3Dx40AyndtTt2mqOFRKqCNGJh6enbjF0"; // ❗ Replace after regenerating
  const endpoint = "https://api.cometapi.com/v1/videos";

  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt.\n\nExample:\ncometvideo A robot flying in the sky", event.threadID, event.messageID);
  }

  try {
    api.setMessageReaction("🌀", event.messageID, () => {}, true);

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", "sora-2");
    form.append("seconds", "4");
    form.append("size", "720x1280");

    // Step 1: Create the video job
    const initRes = await axios.post(endpoint, form, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders()
      }
    });

    const jobId = initRes.data.id;

    if (!jobId) {
      return api.sendMessage("❌ Failed to start video generation job.", event.threadID, event.messageID);
    }

    api.sendMessage("📽️ Video is being generated... Please wait a few moments.", event.threadID, event.messageID);

    // Step 2: Poll for completion
    const pollUrl = `https://api.cometapi.com/v1/videos/${jobId}`;

    let status = "queued";
    let videoUrl = null;
    const maxRetries = 20;
    let attempts = 0;

    while (status !== "succeeded" && attempts < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 sec
      const pollRes = await axios.get(pollUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      const data = pollRes.data;
      status = data.status;

      if (status === "succeeded" && data.url) {
        videoUrl = data.url;
        break;
      }

      if (status === "failed" || data.error) {
        return api.sendMessage(`❌ Video generation failed.\nError: ${data.error || "Unknown error"}`, event.threadID, event.messageID);
      }

      attempts++;
    }

    if (!videoUrl) {
      return api.sendMessage("❌ Timed out waiting for video to be ready. Please try again later.", event.threadID, event.messageID);
    }

    // Step 3: Download the video
    const videoPath = path.join(__dirname, "cache", `comet_${Date.now()}.mp4`);
    const video = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.writeFileSync(videoPath, video.data);

    // Step 4: Send to Messenger
    api.setMessageReaction("✅", event.messageID, () => {}, true);
    api.sendMessage({
      body: `🎉 Here's your video based on: "${prompt}"`,
      attachment: fs.createReadStream(videoPath)
    }, event.threadID, () => {
      setTimeout(() => {
        fs.unlink(videoPath, err => {
          if (err) console.error("Failed to delete video file:", err);
        });
      }, 10000);
    });

  } catch (err) {
    console.error("❌ CometAPI Error:", err?.response?.data || err.message);
    return api.sendMessage("❌ An error occurred while generating the video.", event.threadID, event.messageID);
  }
};
