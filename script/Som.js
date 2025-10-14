const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "commetp",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["remixvideo", "cometremix"],
  description: "Remix an existing video using CometAPI",
  usages: "cometvideo_remix <video_id> | <prompt>",
  credits: "OpenAI + CometAPI",
  cooldowns: 0,
  dependencies: {
    "axios": "",
    "fs": "",
    "path": "",
    "form-data": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const apiKey = "sk-2OH246bUZjsaQUwl3Dx40AyndtTt2mqOFRKqCNGJh6enbjF0"; // Please keep this secret
  if (args.length < 3 || !args.includes("|")) {
    return api.sendMessage(
      "❌ Usage:\ncometvideo_remix <video_id> | <prompt>\n\nExample:\ncometvideo_remix abc123 | A robot dancing in the rain",
      event.threadID,
      event.messageID
    );
  }

  // Split args by "|"
  const separatorIndex = args.indexOf("|");
  const videoId = args.slice(0, separatorIndex).join(" ").trim();
  const prompt = args.slice(separatorIndex + 1).join(" ").trim();

  if (!videoId) return api.sendMessage("❌ Please provide the video ID.", event.threadID, event.messageID);
  if (!prompt) return api.sendMessage("❌ Please provide the prompt after |.", event.threadID, event.messageID);

  try {
    api.setMessageReaction("🌀", event.messageID, () => {}, true);

    // Prepare form data
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", "sora-2");
    form.append("seconds", "4");
    form.append("size", "720x1280");

    // Step 1: Start remix job
    const remixEndpoint = `https://api.cometapi.com/v1/videos/${videoId}/remix`;
    const remixRes = await axios.post(remixEndpoint, form, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const jobId = remixRes.data.id;
    if (!jobId) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("❌ Failed to start remix video job.", event.threadID, event.messageID);
    }

    api.sendMessage("📽️ Remix video is being generated... Please wait a moment.", event.threadID, event.messageID);

    // Step 2: Poll for completion
    const pollUrl = `https://api.cometapi.com/v1/videos/${jobId}`;
    let status = "queued";
    let videoUrl = null;
    const maxRetries = 20;
    let attempts = 0;

    while (status !== "succeeded" && attempts < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const pollRes = await axios.get(pollUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        }
      });

      status = pollRes.data.status;

      if (status === "succeeded" && pollRes.data.url) {
        videoUrl = pollRes.data.url;
        break;
      }

      if (status === "failed" || pollRes.data.error) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(`❌ Remix video generation failed.\nError: ${pollRes.data.error || "Unknown error"}`, event.threadID, event.messageID);
      }

      attempts++;
    }

    if (!videoUrl) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage("❌ Timed out waiting for remix video to be ready. Please try again later.", event.threadID, event.messageID);
    }

    // Step 3: Download video
    const videoPath = path.join(__dirname, "cache", `comet_remix_${Date.now()}.mp4`);
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });

    fs.mkdirSync(path.dirname(videoPath), { recursive: true });
    fs.writeFileSync(videoPath, videoResponse.data);

    // Step 4: Send video to Messenger
    api.setMessageReaction("✅", event.messageID, () => {}, true);
    api.sendMessage(
      {
        body: `🎉 Here's your remixed video based on: "${prompt}"`,
        attachment: fs.createReadStream(videoPath),
      },
      event.threadID,
      () => {
        // Delete video after 10 seconds
        setTimeout(() => {
          fs.unlink(videoPath, err => {
            if (err) console.error("Failed to delete video file:", err);
          });
        }, 10000);
      }
    );

  } catch (error) {
    console.error("❌ CometAPI Remix Error:", error?.response?.data || error.message || error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return api.sendMessage("❌ An error occurred while remixing the video.", event.threadID, event.messageID);
  }
};
