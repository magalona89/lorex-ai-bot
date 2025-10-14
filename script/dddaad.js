const axios = require("axios");

// Maps to track active threads and last quake sent
const activeSessions = new Map(); // threadID => lastQuakeId
const lastSentTime = new Map();   // threadID => timestamp
let monitorStarted = false;

function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function formatPHTime(dateStr) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}

function getTimeAgo(dateStr) {
  const now = getPHTime();
  const then = new Date(dateStr);
  const diff = now - then;

  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return `${day}d ago`;
}

async function fetchEarthquakeData() {
  try {
    const res = await axios.get("https://hutchingd-earthquake-info-philvocs-api-cc.hf.space/info");
    return res.data?.details || null;
  } catch (err) {
    console.error("🌋 [ERROR] Failed to fetch quake data:", err.message);
    return null;
  }
}

async function sendToAllThreads(api, quakeData) {
  const uniqueId = quakeData.informationNumber || quakeData.timestamp;
  const dateTime = formatPHTime(quakeData.dateTime || quakeData.timestamp);
  const location = quakeData.location || "Unknown Location";
  const magnitude = quakeData.magnitude || "N/A";
  const origin = quakeData.origin || "Unknown";
  const infoNum = quakeData.informationNumber || "N/A";
  const sourceUrl = quakeData.sourceUrl?.replace(/\\/g, "/") || "N/A";
  const mapImage = quakeData.mapImageUrl?.replace(/\\/g, "/");
  const timeAgo = getTimeAgo(quakeData.timestamp);

  const message = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗧𝗶𝗺𝗲: ${dateTime}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${location}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${magnitude}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${origin}
🆔 𝗜𝗻𝗳𝗼 No.: ${infoNum}
🔗 𝗟𝗶𝗻𝗸: ${sourceUrl}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${timeAgo} (PH Time)
━━━━━━━━━━━━━━━
`.trim();

  for (const [threadID, lastQuakeId] of activeSessions.entries()) {
    if (lastQuakeId === uniqueId) continue;

    const now = Date.now();
    if (lastSentTime.has(threadID) && now - lastSentTime.get(threadID) < 10000) continue;

    try {
      if (mapImage && global.utils?.getStreamFromURL) {
        await api.sendMessage(
          {
            body: message,
            attachment: await global.utils.getStreamFromURL(mapImage),
          },
          threadID
        );
      } else {
        await api.sendMessage(message, threadID);
      }

      console.log(`✅ [QUAKE] Sent to ${threadID} | M${magnitude} | ${location}`);
      activeSessions.set(threadID, uniqueId);
      lastSentTime.set(threadID, now);
    } catch (err) {
      console.error(`❌ Failed to send to ${threadID}:`, err.message);
    }
  }
}

async function monitorEarthquakes(api) {
  const quake = await fetchEarthquakeData();
  if (quake) {
    await sendToAllThreads(api, quake);
  } else {
    for (const threadID of activeSessions.keys()) {
      await api.sendMessage("⚠️ PHIVOLCS API unavailable. Will retry shortly.", threadID);
    }
  }
}

function startMonitorLoop(api) {
  if (monitorStarted) return;
  monitorStarted = true;
  console.log("🔁 Earthquake monitoring started...");

  setInterval(() => {
    monitorEarthquakes(api).catch(err => {
      console.error("⛔ Earthquake monitor error:", err.message);
    });
  }, 15000); // 15s loop
}

module.exports.config = {
  name: "aquake",
  version: "3.0",
  role: 0,
  hasPrefix: true,
  aliases: ["earthquake", "lindol"],
  description: "PHIVOLCS Earthquake auto-alert (autopost on/off 24/7)",
  usage: "quake on | off | status",
  credits: "Nax + ChatGPT",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const subcmd = args[0]?.toLowerCase();

  switch (subcmd) {
    case "on":
      if (activeSessions.has(threadID)) {
        return api.sendMessage("✅ Earthquake monitoring is already ON for this thread.", threadID, messageID);
      }
      activeSessions.set(threadID, null);
      startMonitorLoop(api);
      return api.sendMessage("📡 Earthquake alerts **activated** in this thread. You’ll receive auto-updates.", threadID, messageID);

    case "off":
      if (!activeSessions.has(threadID)) {
        return api.sendMessage("⚠️ Earthquake monitoring is already OFF here.", threadID, messageID);
      }
      activeSessions.delete(threadID);
      return api.sendMessage("🛑 Earthquake alerts turned **OFF** for this thread.", threadID, messageID);

    case "status":
      if (activeSessions.has(threadID)) {
        return api.sendMessage("✅ Monitoring is **ON** in this thread.", threadID, messageID);
      } else {
        return api.sendMessage("🛑 Monitoring is **OFF** in this thread.", threadID, messageID);
      }

    default:
      return api.sendMessage(
        `📌 Usage:
• quake on — start auto alerts
• quake off — stop alerts
• quake status — check monitoring`,
        threadID,
        messageID
      );
  }
};
