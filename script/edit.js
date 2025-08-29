 const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "2.0",
    author: "Rômeo",
    role: 0,
    shortDescription: "Ghibli-style image generator",
    longDescription: "Transform an image into Studio Ghibli-style art",
    category: "ai",
    guide: "{pn} — reply to an image",
    countDown: 0
  },

  onStart: async function({ api, event, message }) {
    try {
      // Check if the user replied to an image
      const reply = event.messageReply;
      if (!reply || !reply.attachments || reply.attachments.length === 0 || reply.attachments[0].type !== "photo") {
        return message.reply("❌ Please reply to an image.");
      }

      const imageURL = reply.attachments[0].url;

      // Get the API URL dynamically
      const apiUrl = await getApiUrl();
      if (!apiUrl) {
        return message.reply("❌ API is not available right now.");
      }

      // Show processing reaction
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // Request the Ghibli-style image generation API
      const { data } = await axios.get(`${apiUrl}/api/ghibli`, {
        params: { url: imageURL },
        timeout: 30000
      });

      if (!data.output) {
        return message.reply("❌ Failed to generate Ghibli-style image.");
      }

      // Prepare cache directory
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Download the generated image
      const imgPath = path.join(cacheDir, `ghibli_${Date.now()}.jpg`);
      const imgRes = await axios.get(data.output, {
        responseType: "arraybuffer",
        timeout: 30000
      });

      fs.writeFileSync(imgPath, imgRes.data);

      // Show success reaction
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Send the generated image back to the user
      return api.sendMessage(
        {
          body: "✨ Here is your Ghibli-style image:",
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => {
          // Delete cached file after 5 seconds
          setTimeout(() => {
            fs.unlink(imgPath, (err) => {
              if (err) console.error("Error deleting cached file:", err);
            });
          }, 5000);
        }
      );
    } catch (err) {
      console.error("Error while generating Ghibli-style image:", err);
      return api.sendMessage("❌ Error while generating Ghibli-style image.", event.threadID, event.messageID);
    }
  }
};

// Helper function to get API URL from remote JSON
async function getApiUrl() {
  try {
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json",
      { timeout: 10000 }
    );
    return data.api;
  } catch (error) {
    console.error("Error fetching API URL:", error.message);
    return null;
  }
}
