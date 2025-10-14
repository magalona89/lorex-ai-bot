const fs = require('fs');
const axios = require('axios');
const { fal } = require("@fal-ai/client");

module.exports.config = {
  name: 'falvideo',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aivideo', 'genvideo'],
  description: "Generate AI video from image using Fal AI",
  usages: "falvideo [image_url] | [prompt]",
  credits: 'Fal AI + Aria Ai',
  cooldowns: 0
};

fal.config({
  credentials: "99a0bc12-6f6f-4ec4-99d8-dc272b5fb4ca:8532ab7c4fafb94c0ff6bc6e13de58fb"
});

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const inputText = args.join(" ");
  const [imageUrlRaw, ...promptArr] = inputText.split("|");
  const imageUrl = imageUrlRaw?.trim();
  const prompt = promptArr.join("|").trim() || "A cinematic shot of Earth rotating in space, stars in the background";

  if (!imageUrl || !imageUrl.startsWith("http")) {
    return api.sendMessage("❌ Please provide a valid image URL followed by a prompt.\nExample:\nfalvideo https://img.link.jpg | Two cars racing toward sunset", threadID, messageID);
  }

  const loading = await new Promise((resolve) => {
    api.sendMessage("🎬 Generating video, please wait a moment...", threadID, (err, info) => resolve(info));
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

    // Polling until the video is ready
    let result = null;
    for (let tries = 0; tries < 20; tries++) {
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds
      const check = await fal.queue.result("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", { requestId: request_id });
      if (check?.data?.video?.url) {
        result = check.data.video.url;
        break;
      }
    }

    if (!result) {
      return api.editMessage("❌ Failed to generate video in time. Try again later.", loading.messageID, threadID);
    }

    // Download the video file
    const videoRes = await axios.get(result, { responseType: 'stream' });
    const tempPath = `/tmp/falvideo_${Date.now()}.mp4`;
    const writer = fs.createWriteStream(tempPath);

    videoRes.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send video
    await api.sendMessage({
      body: `🎥 𝗔𝗜 𝗩𝗶𝗱𝗲𝗼 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱\n📝 Prompt: ${prompt}\n🌐 Powered by Aria Ai\n🔗 Via Fal AI`,
      attachment: fs.createReadStream(tempPath)
    }, threadID);

    await api.unsendMessage(loading.messageID);
  } catch (err) {
    console.error(err);
    return api.editMessage("❌ An error occurred while generating the video.", loading.messageID, threadID);
  }
};
