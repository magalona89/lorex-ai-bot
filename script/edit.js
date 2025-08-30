const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "edit",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["edit", "animeart"],
  description: "Transform an image into Ghibli-style art",
  usages: "ghibli (reply to image)",
  credits: "Rômeo (converted by OpenAI)",
  cooldowns: 0,
  dependencies: {
    "axios": "",
    "fs": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const reply = event.messageReply;
  if (!reply || !reply.attachments || reply.attachments[0].type !== "photo") {
    return api.sendMessage("❌ Please reply to an image.", event.threadID, event.messageID);
  }

  const imageURL = reply.attachments[0].url;

  try {
    const apiUrl = await getApiUrl();
    if (!apiUrl) {
      return api.sendMessage("❌ API is not available right now.", event.threadID, event.messageID);
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const { data } = await axios.get(`${apiUrl}/api/ghibli`, {
      params: { url: imageURL }
    });

    if (!data.output) {
      return api.sendMessage("❌ Failed to generate Ghibli-style image.", event.threadID, event.messageID);
    }

    const filePath = path.join(__dirname, "cache", `ghibli_${Date.now()}.jpg`);
    const imgRes = await axios.get(data.output, { responseType: "arraybuffer" });

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, imgRes.data);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return api.sendMessage({
      body: "✨ Here is your Ghibli-style image:",
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      setTimeout(() => {
        fs.unlink(filePath, err => {
          if (err) console.error("Error deleting cached file:", err);
        });
      }, 5000);
    });

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Error while generating Ghibli-style image.", event.threadID, event.messageID);
  }
};

// Helper function to fetch API URL
async function getApiUrl() {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json");
    return data.api;
  } catch (err) {
    console.error("Error fetching API URL:", err);
    return null;
  }
}
