const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "url",
  version: "1.6",
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Detects and downloads videos from TikTok, Instagram, and Facebook",
  usages: "[paste video link]",
  credits: "Original by you, converted by ChatGPT",
  cooldowns: 0
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const foundUrls = body.match(urlRegex);

  if (!foundUrls) return;

  const videoUrl = foundUrls[0];
  let platform = "";

  if (videoUrl.includes("tiktok.com")) {
    platform = "🎶 TikTok";
  } else if (videoUrl.includes("instagram.com")) {
    platform = "📷 Instagram";
  } else if (videoUrl.includes("facebook.com")) {
    platform = "📘 Facebook";
  } else {
    return; // Unsupported URL
  }

  api.sendMessage(`🔍 Detected URL: ${videoUrl}\n👉 Platform: ${platform}`, threadID, async () => {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const apiUrl = `https://apis-rho-nine.vercel.app/download?url=${encodeURIComponent(videoUrl)}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000
      });

      if (!response.data.success || !response.data.data.download_url) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("⚠️ Failed to fetch video download link.", threadID, messageID);
      }

      const videoDownloadUrl = response.data.data.download_url;
      const filePath = path.join(__dirname, "cache", `${Date.now()}_video.mp4`);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const writer = fs.createWriteStream(filePath);
      const videoResponse = await axios({
        url: videoDownloadUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      videoResponse.data.pipe(writer);

      writer.on("finish", () => {
        api.setMessageReaction("✅", messageID, () => {}, true);

        api.sendMessage({
          body: `🎥 Here is your video from ${platform}!`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error("❌ Failed to delete file:", err);
          });
        });
      });

      writer.on("error", (err) => {
        console.error("❌ Download error:", err);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("⚠️ Failed to download the video.", threadID, messageID);
      });

    } catch (error) {
      console.error("❌ Error fetching video:", error.message || error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`⚠️ Could not fetch the video.\nError: ${error.message}`, threadID, messageID);
    }
  });
};
