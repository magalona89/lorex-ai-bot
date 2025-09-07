const axios = require("axios");
const fs = require("fs");
const path = require("path");

const startTime = Date.now(); // global uptime start

module.exports.config = {
  name: "uptime",
  version: "1.1",
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Get the bot uptime image",
  usages: "uptime",
  cooldowns: 0,
};

module.exports.run = async function({ api, event }) {
  try {
    // Calculate uptime
    const uptimeMs = Date.now() - startTime;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const seconds = Math.floor((uptimeMs / 1000) % 60);

    // Prepare image URL with query parameters
    const imgUrl = `https://kaiz-apis.gleeze.com/api/uptime?instag=brtbrtbrt15&ghub=Jhon-mark23&fb=Mark Martinez&hours=${hours}&minutes=${minutes}&seconds=${seconds}&botname=Fbot-V1.8`;

    // Ensure cache folder exists
    const cacheDir = path.join(__dirname, "cache");
    fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `uptime_${event.senderID}.png`);

    // Fetch uptime image
    const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, res.data);

    // Send message with attachment then delete file
    api.sendMessage({
      body: "Fbot-V1.8 uptime",
      attachment: fs.createReadStream(filePath),
    }, event.threadID, () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete uptime image:", err);
      });
    });

  } catch (error) {
    console.error("Uptime error:", error);
    api.sendMessage("Failed to fetch uptime image.", event.threadID, event.messageID);
  }
};
