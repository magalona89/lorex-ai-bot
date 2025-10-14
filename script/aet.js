const fs = require('fs');
const axios = require('axios');
const { fal } = require("@fal-ai/client");

module.exports.config = {
  name: 'fal',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aivideo', 'genvideo'],
  description: "Generate AI video from an image (reply to an image or provide URL)",
  usages: "falvideo [prompt]",
  credits: 'Fal AI + Aria Ai',
  cooldowns: 0
};

fal.config({
  credentials: "99a0bc12-6f6f-4ec4-99d8-dc272b5fb4ca:8532ab7c4fafb94c0ff6bc6e13de58fb"
});

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;

  // Get image URL from replied message if available
  let imageUrl = null;
  if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
    for (const attachment of messageReply.attachments) {
      if (attachment.type === "photo" && attachment.url) {
        imageUrl = attachment.url;
        break;
      }
    }
  }

  // If no image from reply, check args for URL
  if (!imageUrl) {
    const possibleUrl = args[0];
    if (possibleUrl && possibleUrl.startsWith("http")) {
      imageUrl = possibleUrl;
      args.shift();
    }
  }

  if (!imageUrl) {
    return api.sendMessage("❌ Please reply to an image or provide a valid image URL to generate the video.", threadID, messageID);
  }

  // Use the rest of args as prompt or default prompt
  const prompt = args.length > 0 ? args.join(" ") : "A cinematic shot of Earth rotating in space, stars in the background";

  // Send loading message
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🎬 Generating AI video from your image, please wait...", threadID, (err, info) => resolve(info));
  });

  try {
    // Submit job to Fal
    const { request_id } = await fal.queue.submit("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt,
        duration: "5",
        negative_prompt: "blur, distort, low quality",
        cfg_scale: 1
      }
    });

    // Poll for result (max ~1min)
    let result = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(res => setTimeout(res, 5000));
      const check = await fal.queue.result("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", { requestId: request_id });
      if (check?.data?.video?.url) {
        result = check.data.video.url;
        break;
      }
    }

    if (!result) {
      return api.editMessage("❌ Failed to generate video in time. Please try again later.", loadingMsg.messageID, threadID);
    }

    // Download video
    const videoResponse = await axios.get(result, { responseType: 'stream' });
    const tempFile = `/tmp/falvideo_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(tempFile);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send video back
    await api.sendMessage({
      body: `🎥 𝗔𝗜 𝗩𝗶𝗱𝗲𝗼 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱\n📝 Prompt: ${prompt}\n🌐 Powered by Aria Ai\n🔗 Via Fal AI`,
      attachment: fs.createReadStream(tempFile)
    }, threadID);

    await api.unsendMessage(loadingMsg.messageID);

    // Clean up temp file
    fs.unlink(tempFile, () => {});

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ An error occurred while generating the video.", loadingMsg.messageID, threadID);
  }
};
