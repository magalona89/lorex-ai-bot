// ================================
// 📁 text2video.js
// 🔹 Generate video from text prompt using Modelslab Text-to-Video API
// 🔹 By Kaizenji + Enhanced by OpenAI
// ================================

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const memoryDir = path.join(__dirname, "video_memory");
if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir);

// 🧠 Helper Functions
const getUserMemory = (uid) => {
  const file = path.join(memoryDir, `${uid}.json`);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file));
    } catch {
      return [];
    }
  }
  return [];
};

const saveUserMemory = (uid, data) => {
  const file = path.join(memoryDir, `${uid}.json`);
  fs.writeFileSync(file, JSON.stringify(data.slice(-10), null, 2));
};

const clearUserMemory = (uid) => {
  const file = path.join(memoryDir, `${uid}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
};

// ================================
// 🔧 Bot Command Configuration
// ================================
module.exports.config = {
  name: "tv5",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["t2v", "videoai"],
  description: "Generate video from text prompt using Modelslab API.",
  usages: "text2video [prompt]",
  credits: "Kaizenji + Enhanced by OpenAI",
  cooldowns: 5,
  dependencies: { "axios": "" }
};

// ================================
// 🚀 Main Command Execution
// ================================
module.exports.run = async function ({ api, event, args }) {
  const uid = event.senderID;
  const input = args.join(" ").trim();

  if (!input) {
    return api.sendMessage(
      "🎬 Please provide a text prompt for the video.\n\nExample:\ntext2video a cute golden retriever running in slow motion",
      event.threadID,
      event.messageID
    );
  }

  if (["clear", "reset"].includes(input.toLowerCase())) {
    clearUserMemory(uid);
    return api.sendMessage("🧠 Memory cleared successfully.", event.threadID, event.messageID);
  }

  api.sendMessage("⌛ Generating video... please wait (this may take 1–2 minutes).", event.threadID, event.messageID);

  const history = getUserMemory(uid);
  history.push({ role: "user", content: input });

  try {
    const response = await axios.post("https://modelslab.com/api/v7/video-fusion/text-to-video", {
      prompt: input,
      model_id: "wan2.5-t2v",
      enhance_prompt: true,
      generate_audio: false,
      key: "YOUR_API_KEY_HERE" // ⚠️ Replace this with your API key or use environment variable
    });

    const result = response.data;

    if (!result || (!result.video_url && !result.id)) {
      return api.sendMessage("⚠️ No response from Modelslab. Please try again later.", event.threadID, event.messageID);
    }

    // 🧩 Check if completed immediately
    if (result.video_url) {
      api.sendMessage(
        `✅ Video generation complete!\n🎥 Watch or download: ${result.video_url}`,
        event.threadID,
        event.messageID
      );
    } else {
      api.sendMessage(
        `🕓 Your video is being processed.\n📦 Generation ID: ${result.id}\nCheck later for the final result.`,
        event.threadID,
        event.messageID
      );
    }

    // 💾 Save memory
    history.push({ role: "assistant", content: input });
    saveUserMemory(uid, history);

  } catch (err) {
    console.error("❌ Video generation error:", err.message);
    api.sendMessage(
      "⚠️ Error 500: Something went wrong while generating your video. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
