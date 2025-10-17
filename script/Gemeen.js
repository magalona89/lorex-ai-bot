const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg"); // for compression

// Queue for video requests
const videoQueue = [];
let isProcessingQueue = false;

module.exports.config = {
  name: "ai",
  version: "11.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gpt5", "gpt-5"],
  description: "GPT-5 PRO v11.0: chat, image analysis, top videos + compression, inline previews, summaries, queue, context-aware, reset, auto react, edit, maintenance",
  usages: "gpt5pro [message], reply to image, 'video [keyword]', or 'reset'. Admin: 'maintaince [on/off]'",
  credits: "Daikyu x Grok x Meta AI",
  cooldowns: 0,
  dependencies: { "axios": "", "fluent-ffmpeg": "" }
};

// Conversation memory per thread (last 50 messages)
const conversationHistory = {};
let maintenanceMode = false;
const adminID = "61580959514473";

// Helper: compress video
async function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions("-vcodec libx264", "-crf 28") // compress
      .save(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject);
  });
}

// Helper: send video attachment with optional compression
async function sendVideoAttachment(api, threadID, messageID, videoUrl, prompt, index=1) {
  try {
    const tempInput = path.join(__dirname, `temp_video_${Date.now()}.mp4`);
    const tempOutput = path.join(__dirname, `temp_video_compressed_${Date.now()}.mp4`);

    const response = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(tempInput);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on("finish", resolve); writer.on("error", reject); });

    await compressVideo(tempInput, tempOutput);

    await api.sendMessage(
      {
        body: `🎬 GPT-5 PRO Video #${index}\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(tempOutput)
      },
      threadID,
      messageID
    );

    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);
    api.setMessageReaction("💡", messageID, (err) => err && console.error(err));

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Failed to download/send video #${index}.`, threadID, messageID);
  }
}

// Process video queue
async function processVideoQueue(api) {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (videoQueue.length > 0) {
    const job = videoQueue.shift();
    const { api, threadID, messageID, uid, videoData } = job;

    for (let i = 0; i < Math.min(videoData.length, 3); i++) {
      const video = videoData[i];
      if (video.url) {
        let summary = "";
        try {
          const gptResp = await axios.get(`https://daikyu-apizer-108.up.railway.app/api/gpt-5?ask=${encodeURIComponent("Summarize this video prompt: " + video.prompt)}&uid=${uid}`);
          summary = gptResp.data.response ? `\nSummary: ${gptResp.data.response}` : "";
        } catch(e) { summary = ""; }

        await sendVideoAttachment(api, threadID, messageID, video.url, video.prompt + summary, i+1);
      }
    }
  }

  isProcessingQueue = false;
}

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;
  let query = args.join(" ").trim();
  let isImage = false;
  let imageUrl = null;

  // Admin maintenance toggle
  if (uid === adminID && args[0]?.toLowerCase() === "maintaince") {
    const status = args[1]?.toLowerCase();
    if (status === "on") { maintenanceMode = true; return api.sendMessage("⚠️ GPT-5 PRO is now in maintenance mode.", threadID, messageID); }
    else if (status === "off") { maintenanceMode = false; return api.sendMessage("✅ GPT-5 PRO is now available.", threadID, messageID); }
    else return api.sendMessage("Usage: maintaince [on/off]", threadID, messageID);
  }

  if (maintenanceMode && uid !== adminID) return api.sendMessage("⚠️ GPT-5 PRO is under maintenance.", threadID, messageID);

  if (query.toLowerCase() === "reset") { conversationHistory[threadID] = []; return api.sendMessage("♻️ GPT-5 PRO conversation reset.", threadID, messageID); }

  // Video command
  if (args[0]?.toLowerCase() === "video") {
    const keyword = args.slice(1).join(" ");
    if (!keyword) return api.sendMessage("Usage: gpt5pro video [keyword]", threadID, messageID);

    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));
    try {
      const { data } = await axios.get(`https://rapido.zetsu.xyz/api/sora?keyword=${encodeURIComponent(keyword)}`);
      api.setMessageReaction("", messageID, (err) => err && console.error(err));

      if (!data || !data.done || !data.url) return api.sendMessage(`❌ No video found for "${keyword}".`, threadID, messageID);

      const results = data.results || [data];
      videoQueue.push({ api, threadID, messageID, uid, videoData: results });
      processVideoQueue(api);
      return;

    } catch (error) {
      console.error(error);
      api.setMessageReaction("", messageID, (err) => err && console.error(err));
      return api.sendMessage("❌ Failed to fetch videos.", threadID, messageID);
    }
  }

  // Image reply
  if (event.type === "message_reply" && event.messageReply.attachments?.length > 0) {
    const attachment = event.messageReply.attachments[0];
    if (attachment.type === "photo") { isImage = true; imageUrl = attachment.url; query = "Analyze this image: " + imageUrl; }
  }

  if (!query) return api.sendMessage("🤖 GPT-5 PRO ONLINE\nAsk anything, reply to image, 'video [keyword]', or 'reset'.", threadID, messageID);

  try {
    if (!conversationHistory[threadID]) conversationHistory[threadID] = [];
    conversationHistory[threadID].push({ role: "user", content: query });
    if (conversationHistory[threadID].length > 50) conversationHistory[threadID].shift();

    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));

    const { data } = await axios.get(`https://daikyu-apizer-108.up.railway.app/api/gpt-5?ask=${encodeURIComponent(query)}&uid=${uid}`);
    const response = data.response || "⚠️ No response from GPT-5 PRO.";
    conversationHistory[threadID].push({ role: "ai", content: response });
    if (conversationHistory[threadID].length > 50) conversationHistory[threadID].shift();

    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage(`✨ GPT-5 PRO:\n${response}`, threadID, (err, info) => {
      if (err) console.error(err); else api.setMessageReaction("💡", info.messageID, (err) => err && console.error(err));
    });

  } catch (error) {
    console.error(error);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    return api.sendMessage("❌ GPT-5 PRO is unreachable. Try again later.", threadID, messageID);
  }
};
