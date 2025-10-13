const axios = require("axios");

const activeSessions = new Map(); // threadID => lastQuakeId sent to this thread
let monitorStarted = false;

// Helper functions
function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}
function formatPHTime(dateStr) {
  // API might provide UTC or local string. Try to parse and convert to PH time.
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

async function fetchEarthquakeData() {
  try {
    const res = await axios.get("https://hutchingd-earthquake-info-philvocs-api-cc.hf.space/info");
    if (res.data && res.data.details) {
      return res.data.details;
    }
    return null;
  } catch (error) {
    console.error("Quake API fetch error:", error);
    return null;
  }
}

async function checkForUpdates(api) {
  const quake = await fetchEarthquakeData();
  if (!quake) return;

  // Use informationNumber or timestamp as unique event id
  const uniqueQuakeId = quake.informationNumber || quake.timestamp;
  if (!uniqueQuakeId) return;

  for (const [threadID, lastSentQuakeId] of activeSessions.entries()) {
    if (lastSentQuakeId === uniqueQuakeId) continue; // already notified this thread

    // Compose message
    const dateTimeRaw = quake.dateTime || quake.timestamp || "Unknown Time";
    const dateTimePH = formatPHTime(dateTimeRaw);
    const location = quake.location || "Unknown Location";
    const magnitude = quake.magnitude || "N/A";
    const origin = quake.origin || "Unknown";
    const infoNum = quake.informationNumber || "N/A";
    const sourceUrl = quake.sourceUrl?.replace(/\\/g, "/") || "No link available";
    const mapImg = quake.mapImageUrl?.replace(/\\/g, "/");

    const msg = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTimePH}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${location}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${magnitude}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${origin}
🆔 𝗜𝗻𝗳𝗼 𝗡𝗼.: ${infoNum}
🔗 𝗦𝗼𝘂𝗿𝗰𝗲: ${sourceUrl}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${getTimeAgo(quake.timestamp)} (PH Time)
━━━━━━━━━━━━━━━
`;

    // Send message and update per-thread cache
    if (mapImg && global.utils?.getStreamFromURL) {
      await api.sendMessage({ body: msg, attachment: await global.utils.getStreamFromURL(mapImg) }, threadID);
    } else {
      await api.sendMessage(msg, threadID);
    }
    activeSessions.set(threadID, uniqueQuakeId); // after send, cache the quake id
  }
}

function startEarthquakeMonitor(api) {
  if (monitorStarted) return;
  monitorStarted = true;
  setInterval(() => {
    checkForUpdates(api).catch(console.error);
  }, 15000); // check every 15s
}

module.exports.config = {
  name: "qx",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Auto earthquake tracker using PHIVOLCS live data.",
  usage: "earthquake on | off",
  credits: "Nax",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const subcmd = args[0]?.toLowerCase();

  if (subcmd === "off") {
    if (!activeSessions.has(threadID)) {
      return api.sendMessage("⚠️ You don't have an active earthquake session.", threadID, messageID);
    }
    activeSessions.delete(threadID);
    return api.sendMessage("🛑 Earthquake monitoring stopped.", threadID, messageID);
  }

  if (subcmd !== "on") {
    return api.sendMessage("📌 Usage:\n• earthquake on — start monitoring\n• earthquake off — stop monitoring", threadID, messageID);
  }

  if (activeSessions.has(threadID)) {
    return api.sendMessage("📡 You're already tracking earthquakes. Use 'earthquake off' to stop.", threadID, messageID);
  }

  activeSessions.set(threadID, null); // subscribe this thread (lastQuakeId is null initially)
  api.sendMessage("✅ Earthquake monitoring activated! You'll be notified automatically when new quakes are detected.", threadID, messageID);

  startEarthquakeMonitor(api);
};
