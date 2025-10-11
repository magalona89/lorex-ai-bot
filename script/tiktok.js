const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ariavideo",
  version: "1.3",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["ariavideo", "tiktoksearch", "ariatiktok"],
  description: "Search and send a random TikTok video from a keyword",
  usages: "ariavideo [keyword]",
  credits: "Aria Ai",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim() || "Shoti";
  const apiUrl = `https://kaiz-apis.gleeze.com/api/tiksearch?search=${encodeURIComponent(query)}&apikey=66c17057-c78d-4d81-8581-eaf6d997f7`;

  // React to show processing
  api.setMessageReaction("🔁", messageID, () => {}, true);

  setTimeout(() => {
    api.setMessageReaction("", messageID, () => {}, true);
  }, 5000);

  try {
    const res = await axios.get(apiUrl);
    const videos = res.data?.data?.videos;

    if (!Array.isArray(videos) || videos.length === 0) {
      return api.sendMessage("⛔ No TikTok videos found for that keyword.", threadID, messageID);
    }

    // Pick random video
    const video = videos[Math.floor(Math.random() * videos.length)];

    // Create cache folder and file path
    const filePath = path.join(__dirname, "cache", `tiktok_${Date.now()}.mp4`);
    fs.ensureDirSync(path.dirname(filePath));

    const videoStream = await axios.get(video.play, { responseType: "stream" });

    // Save to file
    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Send video
    api.sendMessage({
      body: `💾 Aria TikTok\n🎞 ${video.title}\n👤 Author: ${video.author?.nickname || "Unknown"}\n🎶 Music: ${video.music_info?.title || "Unknown"}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage("🚫 Error while fetching TikTok video. Try again later.", threadID, messageID);
  }
};
