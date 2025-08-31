const axios = require("axios");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

module.exports.config = {
  name: "video",
  version: "1.5.0",
  role: 0,
  author: "ArYAN - Decor by Aminul Sordar",
  description: "🎬 Download YouTube video or audio by name or URL",
  category: "media",
  guide: {
    en: "{pn} <title>\n{pn} -v <url>\n{pn} -a <url>"
  },
  countDown: 5,
  hasPrefix: true,
  aliases: ["yt", "yta", "ytv"],
  dependencies: {
    axios: "",
    "node-fetch": "",
    "yt-search": ""
  }
};

module.exports.languages = {
  en: {
    missingInput: "❌ Please enter a title or valid YouTube URL.",
    invalidURL: "❌ Invalid YouTube URL.",
    notFound: "❌ No results found.",
    longVideo: "⚠️ This video is too long (%1). Only videos under 10 minutes are supported.",
    downloading: "📥 Fetching your media...",
    timeout: "⚠️ Server timeout. Please try again later.",
    aborted: "⚠️ Request took too long and was aborted.",
    failedDownload: "❌ Download failed with status: %1",
    failedAPI: "❌ API Error: %1"
  }
};

module.exports.onStart = async function ({ api, event, args, getLang }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const apiKey = "itzaryan";
  let videoId, topResult, type = "video";

  const processingMessage = await api.sendMessage(getLang("downloading"), threadID, null, messageID);

  try {
    const mode = args[0];
    const inputArg = args[1];

    if ((mode === "-v" || mode === "-a") && inputArg) {
      type = mode === "-a" ? "audio" : "video";

      let urlObj;
      try {
        urlObj = new URL(inputArg);
      } catch {
        throw new Error(getLang("invalidURL"));
      }

      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes("youtube.com")) {
        const urlParams = new URLSearchParams(urlObj.search);
        videoId = urlParams.get("v");
      }

      if (!videoId) throw new Error(getLang("invalidURL"));

      const searchResults = await ytSearch(videoId);
      if (!searchResults || !searchResults.videos.length)
        throw new Error(getLang("notFound"));

      topResult = searchResults.videos[0];
    } else {
      const query = args.join(" ");
      if (!query) throw new Error(getLang("missingInput"));

      const searchResults = await ytSearch(query);
      if (!searchResults || !searchResults.videos.length)
        throw new Error(getLang("notFound"));

      topResult = searchResults.videos[0];
      videoId = topResult.videoId;
    }

    const timestamp = topResult.timestamp;
    const parts = timestamp.split(":").map(Number);
    const durationSeconds = parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];

    if (durationSeconds > 600)
      throw new Error(getLang("longVideo", timestamp));

    api.setMessageReaction("⌛", messageID, () => {}, true);

    const apiUrl = `https://www-xyz-free.vercel.app/aryan/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;
    let downloadResponse;
    try {
      downloadResponse = await axios.get(apiUrl, { timeout: 30000 });
    } catch (error) {
      if (error.response?.status === 504) {
        throw new Error(getLang("timeout"));
      } else if (error.code === "ECONNABORTED") {
        throw new Error(getLang("aborted"));
      } else {
        throw new Error(getLang("failedAPI", error.message));
      }
    }

    const downloadUrl = downloadResponse.data.downloadUrl;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(getLang("failedDownload", response.status));
    }

    const ext = type === "audio" ? "mp3" : "mp4";
    const safeTitle = topResult.title.replace(/[\\/:*?"<>|]/g, "").substring(0, 50);
    const filename = `${safeTitle}.${ext}`;
    const downloadPath = path.join(__dirname, filename);
    const buffer = await response.buffer();
    fs.writeFileSync(downloadPath, buffer);

    api.setMessageReaction("✅", messageID, () => {}, true);

    await api.sendMessage({
      attachment: fs.createReadStream(downloadPath),
      body:
        `${type === "audio" ? "🎵 AUDIO INFO" : "🎬 VIDEO INFO"}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 Title: ${topResult.title}\n` +
        `🎞 Duration: ${topResult.timestamp}\n` +
        `📺 Channel: ${topResult.author.name}\n` +
        `👁 Views: ${topResult.views.toLocaleString()}\n` +
        `📅 Uploaded: ${topResult.ago}`
    }, threadID, () => {
      fs.unlinkSync(downloadPath);
      api.unsendMessage(processingMessage.messageID);
    }, messageID);

  } catch (err) {
    console.error("YouTube Download Error:", err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ " + err.message, threadID, messageID);
  }
};
