const fs = require('fs');
const axios = require('axios');
const { fal } = require("@fal-ai/client");

module.exports.config = {
  name: 'pv',
  version: '1.2.0',
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
    // 1. Get image URL from replied image (preferred)
    let imageUrl = null;
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
      const photoAttachment = messageReply.attachments.find(att => att.type === "photo" && att.url);
      if (photoAttachment) imageUrl = photoAttachment.url;
    }

    // 2. If no reply image, use first arg as URL (if valid)
    if (!imageUrl && args.length > 0) {
      if (args[0].startsWith("http")) {
        imageUrl = args.shift();
      }
    }

    if (!imageUrl) {
      return api.sendMessage(
        "❌ Please reply to an image or provide a valid image URL as the first argument.\nExample:\nfalvideo https://example.com/image.jpg A beautiful sunrise",
        threadID, messageID
      );
    }

    // 3. Get prompt from remaining args or use default
    const prompt = args.length > 0 ? args.join(" ") : "A cinematic shot of Earth rotating in space, stars in the background";

    // 4. Send loading message
    const loadingMsg = await new Promise(resolve => {
      api.sendMessage("🎬 Generating AI video from your image, please wait...", threadID, (err, info) => resolve(info));
    });

    // 5. Submit to Fal AI queue
    const { request_id } = await fal.queue.submit("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt,
        duration: "5",
        negative_prompt: "blur, distort, low quality",
        cfg_scale: 1
      }
    });

    // 6. Poll every 5 seconds up to 1 minute
    let videoUrl = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(res => setTimeout(res, 5000));
      const result = await fal.queue.result("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", { requestId: request_id });
      if (result?.data?.video?.url) {
        videoUrl = result.data.video.url;
        break;
      }
    }

    if (!videoUrl) {
      return api.editMessage("❌ Video generation timed out. Please try again later.", loadingMsg.messageID, threadID);
    }

    // 7. Download video file
    const response = await axios.get(videoUrl, { responseType: 'stream' });
    const tempPath = `/tmp/falvideo_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // 8. Send video attachment
    await api.sendMessage({
      body: `🎥 AI Video Generated\n📝 Prompt: ${prompt}\n🌐 Powered by Aria Ai\n🔗 Via Fal AI`,
      attachment: fs.createReadStream(tempPath)
    }, threadID);

    // 9. Remove loading message
    await api.unsendMessage(loadingMsg.messageID);

    // 10. Delete temp file
    fs.unlink(tempPath, () => {});

  } catch (error) {
    console.error("falvideo error:", error);
    return api.sendMessage("❌ An error occurred while generating the video. Please try again later.", threadID);
  }
};
