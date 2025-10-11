+cmd install tiksearch.js const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cacheDir = path.join(__dirname, "/cache");
const tmp = path.join(__dirname, "/tmp");

module.exports = {
  config: {
    name: "play",
    version: "2.4",
    aliases: ["tiktoksearch", "tsearch"],
    author: "Rômeo",
    countDown: 0,
    role: 0,
    description: {
      en: "Search and download TikTok video using /api/tiksearch endpoint",
    },
    category: "media",
    guide: {
      en: "{pn} <username or keyword>: search TikTok videos and download selected video",
    },
  },

  onStart: async ({ api, args, event }) => {
    if (args.length < 1)
      return api.sendMessage("❌ Please use the format '/tiksearch <keyword>'.", event.threadID, event.messageID);

    const input = args.join(" ");

    try {
      const BASE_URL = await getApiUrl();
      if (!BASE_URL)
        return api.sendMessage("❌ Could not fetch API URL. Try again later.", event.threadID, event.messageID);

      const { data } = await axios.get(`${BASE_URL}/api/tiksearch?q=${encodeURIComponent(input)}`);
      console.log("TikSearch API Response:", data);

      if (!data.success || !data.result || !data.result.videos || data.result.videos.length === 0)
        return api.sendMessage(`⭕ No TikTok results found for: ${input}`, event.threadID, event.messageID);

      const videos = data.result.videos.slice(0, 6);

      let msg = `🔍 TikTok search results for: "${input}"\n\n`;
      videos.forEach((video, index) => {
        msg += `🎯 ${index + 1}. ${video.title || "(No title)"}\n`;
        msg += `⏱ Duration: ${video.duration}s | ▶️ Plays: ${video.play_count} | ❤️ Likes: ${video.digg_count}\n`;
        msg += `💬 Comments: ${video.comment_count} | 🔗 Reply to select\n\n`;
      });

      api.sendMessage(
        {
          body: msg,
          attachment: await Promise.all(
            videos.map((v) => fahimcalyx(v.cover, path.join(tmp, `tik_thumb_${v.video_id}.jpg`)))
          ),
        },
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "tiksearch",
            messageID: info.messageID,
            author: event.senderID,
            videos,
          });
        },
        event.messageID
      );
    } catch (error) {
      console.error("TikSearch Error:", error.response?.data || error.message);
      return api.sendMessage("❌ Failed to search TikTok.", event.threadID, event.messageID);
    }
  },

  onReply: async ({ event, api, Reply }) => {
    await api.unsendMessage(Reply.messageID);
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice <= 0 || choice > Reply.videos.length)
      return api.sendMessage("❌ Please enter a valid number.", event.threadID, event.messageID);

    const selectedVideo = Reply.videos[choice - 1];
    await downloadTikVideo(api, event, selectedVideo);
  },
};

// ======== Download TikTok Video (selected) ======== //
async function downloadTikVideo(api, event, video) {
  try {
    const videoUrl = video.play;
    const totalSize = await getTotalSize(videoUrl);
    const videoPath = path.join(cacheDir, `tik_video_${Date.now()}.mp4`);

    await downloadFileParallel(videoUrl, videoPath, totalSize, 5);

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    await api.sendMessage(
      {
        body: `📥 TikTok download successful:\n🎯 Title: ${video.title || "(No title)"}\n▶️ Plays: ${video.play_count}\n❤️ Likes: ${video.digg_count}\n💬 Comments: ${video.comment_count}`,
        attachment: fs.createReadStream(videoPath),
      },
      event.threadID,
      () => fs.unlinkSync(videoPath),
      event.messageID
    );
  } catch (e) {
    console.error("Download Error:", e);
    return api.sendMessage("❌ Failed to download TikTok video.", event.threadID, event.messageID);
  }
}

// ======== Helpers ======== //
async function fahimcalyx(url, pathName) {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    response.data.pipe(fs.createWriteStream(pathName));
    return new Promise((resolve) => {
      response.data.on("end", () => resolve(fs.createReadStream(pathName)));
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getTotalSize(url) {
  const response = await axios.head(url);
  return parseInt(response.headers["content-length"], 10);
}

async function downloadFileParallel(url, filePath, totalSize, numChunks) {
  const chunkSize = Math.ceil(totalSize / numChunks);
  const chunks = [];

  async function downloadChunk(url, start, end, index) {
    try {
      const response = await axios.get(url, {
        headers: { Range: `bytes=${start}-${end}` },
        responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading chunk ${index + 1}:`, error);
      throw error;
    }
  }

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize - 1, totalSize - 1);
    chunks.push(downloadChunk(url, start, end, i));
  }

  try {
    const buffers = await Promise.all(chunks);
    const fileStream = fs.createWriteStream(filePath);
    for (const buffer of buffers) fileStream.write(Buffer.from(buffer));
    await new Promise((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
      fileStream.end();
    });
  } catch (error) {
    console.error("Error writing TikTok video:", error);
  }
}

async function getApiUrl() {
  try {
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json"
    );
    return data.api;
  } catch (error) {
    console.error("Error fetching API URL:", error);
    return null;
  }
}
