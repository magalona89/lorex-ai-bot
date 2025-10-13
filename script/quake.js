const axios = require("axios");

const activeSessions = new Map(); // threadID => lastQuakeId
const lastSentTime = new Map(); // threadID => timestamp of last message
let monitorStarted = false;

// Helper functions
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
  if (!quake) {
    // Notify all active threads if API fails
    for (const threadID of activeSessions.keys()) {
      await api.sendMessage("⚠️ PHIVOLCS API is currently unavailable. Monitoring will resume once it's back.", threadID);
    }
    return;
  }

  const uniqueQuakeId = quake.informationNumber || quake.timestamp;
  if (!uniqueQuakeId) return;

  const dateTimeRaw = quake.dateTime || quake.timestamp || "Unknown Time";
  const dateTimePH = formatPHTime(dateTimeRaw);
  const location = quake.location || "Unknown Location";
  const magnitude = quake.magnitude || "N/A";
  const origin = quake.origin || "Unknown";
  const infoNum = quake.informationNumber || "N/A";
  const sourceUrl = quake.sourceUrl?.replace(/\\/g, "/") || "No link available";
  const mapImg = quake.mapImageUrl?.replace(/\\/g, "/");
  const timeAgo = getTimeAgo(quake.timestamp);

  const msg = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTimePH}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${location}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${magnitude}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${origin}
🆔 𝗜𝗻𝗳𝗼 𝗡𝗼.: ${infoNum}
🔗 𝗦𝗼𝘂𝗿𝗰𝗲: ${sourceUrl}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${timeAgo} (PH Time)
━━━━━━━━━━━━━━━
`;

  for (const [threadID, lastQuakeId] of activeSessions.entries()) {
    if (lastQuakeId === uniqueQuakeId) continue;

    // Anti-spam: throttle sending to same thread (e.g. multiple in 10s)
    const now = Date.now();
    if (lastSentTime.has(threadID) && now - lastSentTime.get(threadID) < 10000) {
      continue; // skip sending if last message was <10s ago
    }

    try {
      if (mapImg && global.utils?.getStreamFromURL) {
        await api.sendMessage(
          {
            body: msg,
            attachment: await global.utils.getStreamFromURL(mapImg),
          },
          threadID
        );
      } else {
        await api.sendMessage(msg, threadID);
      }

      console.log(`[NEW QUAKE] Sent to ${threadID} | M${magnitude} at ${location}`);
      activeSessions.set(threadID, uniqueQuakeId);
      lastSentTime.set(threadID, now);
    } catch (err) {
      console.error(`Failed to send quake update to ${threadID}:`, err);
    }
  }
}

function startEarthquakeMonitor(api) {
  if (monitorStarted) return;
  monitorStarted = true;
  console.log("[🔁] Earthquake monitor started...");
  setInterval(() => {
    checkForUpdates(api).catch(console.error);
  }, 15000);
}

module.exports.config = {
  name: "quake",
  version: "2.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["earthquake", "lindol"],
  description: "Auto earthquake tracker using PHIVOLCS live data.",
  usage: "quake on | off | status",
  credits: "Nax + ChatGPT",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const subcmd = args[0]?.toLowerCase();

  switch (subcmd) {
    case "off":
      if (!activeSessions.has(threadID)) {
        return api.sendMessage("⚠️ You don't have an active earthquake session.", threadID, messageID);
      }
      activeSessions.delete(threadID);
      return api.sendMessage("🛑 Earthquake monitoring stopped for this thread.", threadID, messageID);

    case "status":
      if (activeSessions.has(threadID)) {
        return api.sendMessage("📡 Earthquake monitoring is currently **ON** in this thread.", threadID, messageID);
      } else {
        return api.sendMessage("🛑 Earthquake monitoring is currently **OFF** in this thread.", threadID, messageID);
      }

    case "on":
      if (activeSessions.has(threadID)) {
        return api.sendMessage("✅ Earthquake monitoring is already active in this thread.", threadID, messageID);
      }
      activeSessions.set(threadID, null);
      startEarthquakeMonitor(api);
      return api.sendMessage("✅ Earthquake monitoring **activated**! You will receive alerts for new events.", threadID, messageID);

    default:
      return api.sendMessage(
        "📌 Usage:\n• quake on — start monitoring\n• quake off — stop monitoring\n• quake status — check if active",
        threadID,
        messageID
      );
  }
};
