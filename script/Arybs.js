const axios = require("axios");
let autoPostEnabled = false;
let monitorStarted = false;
let lastPostedId = null;

// Format helpers
function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function formatPHTime(dateStr) {
  if (!dateStr) return "Unknown Time";
  const local = new Date(dateStr);
  return local.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}

function getTimeAgo(date) {
  const now = getPHTime();
  const diff = now - new Date(date);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  return `${day}d ago`;
}

// Get data from PHIVOLCS API
async function fetchEarthquakeData() {
  try {
    const res = await axios.get("https://hutchingd-earthquake-info-philvocs-api-cc.hf.space/info");
    if (res.data && res.data.details) return res.data.details;
  } catch (err) {
    console.error("🌋 API ERROR:", err);
  }
  return null;
}

// Create the Facebook post
async function createEarthquakePost(api, quake) {
  const uniqueId = quake.informationNumber || quake.timestamp;
  if (lastPostedId === uniqueId) return; // already posted

  const dateTimePH = formatPHTime(quake.dateTime || quake.timestamp);
  const msg = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTimePH}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${quake.location || "Unknown"}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${quake.magnitude || "N/A"}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${quake.origin || "Unknown"}
🆔 𝗜𝗻𝗳𝗼 𝗡𝗼.: ${quake.informationNumber || "N/A"}
🔗 𝗦𝗼𝘂𝗿𝗰𝗲: ${quake.sourceUrl || "No link"}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${getTimeAgo(quake.timestamp)}
━━━━━━━━━━━━━━━`.trim();

  const mapUrl = quake.mapImageUrl?.replace(/\\/g, "/");
  const attachments = [];

  // If there's a map image, try to get a stream
  if (mapUrl && global.utils?.getStreamFromURL) {
    try {
      attachments.push(await global.utils.getStreamFromURL(mapUrl));
    } catch (e) {
      console.error("⚠️ Failed to fetch map image:", e.message);
    }
  }

  try {
    const postData = { body: msg };
    if (attachments.length > 0) postData.attachment = attachments.length === 1 ? attachments[0] : attachments;

    const url = await api.createPost(postData);
    console.log("✅ Earthquake auto-posted to Facebook:", url || "No URL");
    lastPostedId = uniqueId;
  } catch (err) {
    console.error("❌ Failed to auto-post:", err?.message || err);
  }
}

// Auto-post loop every 4 minutes
function startAutoPoster(api) {
  if (monitorStarted) return;
  monitorStarted = true;

  setInterval(async () => {
    if (!autoPostEnabled) return;
    const quake = await fetchEarthquakeData();
    if (quake) {
      await createEarthquakePost(api, quake);
    }
  }, 4 * 60 * 1000); // Every 4 minutes
}

module.exports.config = {
  name: "atupost",
  version: "2.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["autopost"],
  description: "Post to Facebook manually or turn on/off auto-posting every 4 minutes.",
  usages: "post <text> | post auto on/off/status",
  cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, attachments } = event;
  const subCmd = args[0]?.toLowerCase();

  // Start auto-monitor once globally
  startAutoPoster(api);

  // Handle auto-post on/off/status
  if (subCmd === "auto") {
    const mode = args[1]?.toLowerCase();
    if (mode === "on") {
      if (autoPostEnabled) {
        return api.sendMessage("✅ Auto-posting is already **enabled**.", threadID, messageID);
      }
      autoPostEnabled = true;
      return api.sendMessage("📡 Auto-posting **enabled**! Earthquake updates will be posted every 4 minutes.", threadID, messageID);
    }

    if (mode === "off") {
      if (!autoPostEnabled) {
        return api.sendMessage("🛑 Auto-posting is already **disabled**.", threadID, messageID);
      }
      autoPostEnabled = false;
      return api.sendMessage("🛑 Auto-posting **disabled**. No more automated posts.", threadID, messageID);
    }

    if (mode === "status") {
      return api.sendMessage(
        `📊 Auto-posting is currently **${autoPostEnabled ? "ON ✅" : "OFF ❌"}**.`,
        threadID,
        messageID
      );
    }

    return api.sendMessage("❓ Usage: post auto on | off | status", threadID, messageID);
  }

  // Manual post
  const postMessage = args.join(" ");
  const allAttachments = (messageReply?.attachments?.length ? messageReply.attachments : attachments) || [];
  const files = [];

  if (!postMessage && allAttachments.length === 0) {
    return api.sendMessage("⚠️ Please provide a message or image to post.", threadID, messageID);
  }

  const fs = require("fs");
  const path = require("path");

  const tempDir = path.join(__dirname, "cache");
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Download attachments
    for (const attachment of allAttachments) {
      const filePath = path.join(tempDir, `${Date.now()}_${attachment.filename}`);
      const res = await axios.get(attachment.url, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      files.push(fs.createReadStream(filePath));
    }

    const postData = { body: postMessage };
    if (files.length > 0) postData.attachment = files.length === 1 ? files[0] : files;

    const url = await api.createPost(postData);
    api.sendMessage(`✅ Post created successfully!\n🔗 ${url || "No URL returned."}`, threadID, messageID);
  } catch (err) {
    console.error("❌ Manual post failed:", err);
    api.sendMessage("❌ Failed to create post.", threadID, messageID);
  } finally {
    // Clean up temp files
    files.forEach(file => {
      if (file.path) {
        fs.unlink(file.path, err => {
          if (err) console.error("❌ Failed to delete temp file:", err);
        });
      }
    });
  }
};
