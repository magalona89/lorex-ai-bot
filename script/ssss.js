const fs = require('fs');
const axios = require('axios');
const { fal } = require('@fal-ai/client');

fal.config({
  credentials: "99a0bc12-6f6f-4ec4-99d8-dc272b5fb4ca:8532ab7c4fafb94c0ff6bc6e13de58fb"
});

module.exports.config = {
  name: 'hb',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aivideo', 'genvideo'],
  description: "🎬 Generate an AI video using image + prompt",
  usages: "falvideo [prompt] (reply to image or provide image URL)",
  credits: "Fal AI + Aria Ai",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  try {
    // 1. Get image from reply or first argument (URL)
    let imageUrl = null;

    if (messageReply && messageReply.attachments?.length > 0) {
      const image = messageReply.attachments.find(att => att.type === 'photo' && att.url);
      if (image) imageUrl = image.url;
    }

    // If not from reply, check first arg
    if (!imageUrl && args[0]?.startsWith("http")) {
      imageUrl = args.shift();
    }

    if (!imageUrl) {
      return api.sendMessage(
        "❌ Please reply to an image or provide a valid image URL.\n\nExample:\nfalvideo https://example.com/image.jpg A dramatic sunset over the ocean",
        threadID, messageID
      );
    }

    // 2. Get prompt
    const prompt = args.length > 0
      ? args.join(" ")
      : "A cinematic flyover of Earth from space, clouds and lights visible";

    // 3. Send loading message
    const loading = await new Promise(resolve => {
      api.sendMessage(`🎥 Creating video from image...\n📝 Prompt: ${prompt}`, threadID, (err, info) => resolve(info));
    });

    // 4. Submit to Fal
    const { request_id } = await fal.queue.submit("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt,
        duration: "5",
        negative_prompt: "blur, distort, low quality",
        cfg_scale: 1
      }
    });

    if (!request_id) {
      return api.editMessage("❌ Failed to send video generation request.", loading.messageID, threadID);
    }

    // 5. Poll for result (up to 1 minute)
    let videoUrl = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(res => setTimeout(res, 5000));
      const result = await fal.queue.result("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
        requestId: request_id
      });
      if (result?.data?.video?.url) {
        videoUrl = result.data.video.url;
        break;
      }
    }

    if (!videoUrl) {
      return api.editMessage("⏱️ Video generation took too long. Try again later.", loading.messageID, threadID);
    }

    // 6. Download the video
    const videoStream = await axios.get(videoUrl, { responseType: 'stream' });
    const filePath = `/tmp/falvideo_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // 7. Send the video
    await api.sendMessage({
      body: `✅ 𝗔𝗜 𝗩𝗶𝗱𝗲𝗼 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱\n📝 Prompt: ${prompt}\n🔗 Via Fal AI\n🤖 Powered by Aria Ai`,
      attachment: fs.createReadStream(filePath)
    }, threadID);

    // 8. Cleanup
    await api.unsendMessage(loading.messageID);
    fs.unlink(filePath, () => {});

  } catch (err) {
    console.error("FalVideo Error:", err);
    return api.sendMessage("❌ An error occurred while generating the video. Please try again later.", threadID);
  }
};
