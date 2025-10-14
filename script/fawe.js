const fs = require('fs');
const axios = require('axios');
const { fal } = require("@fal-ai/client");

module.exports.config = {
  name: 'videp',
  version: '1.3.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aivideo', 'genvideo'],
  description: "Generate AI video from replied image or URL",
  usages: "falvideo [prompt] (reply to image or provide URL as first arg)",
  credits: 'Fal AI + Aria Ai',
  cooldowns: 5
};

fal.config({
  credentials: "99a0bc12-6f6f-4ec4-99d8-dc272b5fb4ca:8532ab7c4fafb94c0ff6bc6e13de58fb"
});

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  try {
    // 1. Try get image url from reply attachments
    let imageUrl = null;
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
      const photo = messageReply.attachments.find(att => att.type === "photo" && att.url);
      if (photo) imageUrl = photo.url;
    }

    // 2. If no reply image, check first arg if valid url
    if (!imageUrl && args.length > 0) {
      if (args[0].startsWith("http://") || args[0].startsWith("https://")) {
        imageUrl = args.shift();
      }
    }

    // 3. Validate imageUrl
    if (!imageUrl) {
      return api.sendMessage(
        "❌ Please reply to an image or provide a valid image URL as the first argument.\nExample:\nfalvideo https://example.com/image.jpg A beautiful sunrise",
        threadID, messageID
      );
    }

    // 4. Get prompt from args or default
    const prompt = args.length > 0 ? args.join(" ") : "A cinematic shot of Earth rotating in space, stars in the background";

    // 5. Send loading message
    const loadingMsg = await new Promise(resolve => {
      api.sendMessage("🎬 Generating AI video, please wait...", threadID, (err, info) => resolve(info));
    });

    // 6. Submit Fal AI video generation job
    const submitResponse = await fal.queue.submit("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt,
        duration: "5",
        negative_prompt: "blur, distort, low quality",
        cfg_scale: 1
      }
    });

    const requestId = submitResponse.request_id || submitResponse.requestId;
    if (!requestId) {
      await api.editMessage("❌ Failed to submit video generation request.", loadingMsg.messageID, threadID);
      return;
    }

    // 7. Poll for result up to 60 seconds (12 tries)
    let videoUrl = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(res => setTimeout(res, 5000)); // 5 sec wait
      const statusResponse = await fal.queue.result("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", { requestId });
      if (statusResponse?.data?.video?.url) {
        videoUrl = statusResponse.data.video.url;
        break;
      }
    }

    if (!videoUrl) {
      await api.editMessage("❌ Video generation timed out. Please try again later.", loadingMsg.messageID, threadID);
      return;
    }

    // 8. Download video stream
    const videoResp = await axios.get(videoUrl, { responseType: "stream" });
    const tempPath = `/tmp/falvideo_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(tempPath);
    videoResp.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // 9. Send video file back
    await api.sendMessage({
      body: `🎥 AI Video Generated\n📝 Prompt: ${prompt}\n🌐 Powered by Aria Ai\n🔗 Via Fal AI`,
      attachment: fs.createReadStream(tempPath)
    }, threadID);

    // 10. Remove loading message
    await api.unsendMessage(loadingMsg.messageID);

    // 11. Delete temp video file
    fs.unlink(tempPath, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

  } catch (error) {
    console.error("falvideo error:", error);
    await api.sendMessage("❌ An error occurred while generating the video. Please try again later.", threadID);
  }
};
