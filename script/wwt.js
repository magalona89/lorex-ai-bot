const axios = require("axios");

const sentQuakeIDs = new Set(); // Store sent quake IDs to avoid duplicates
let monitorStarted = false;

// Get PH Time
function getPHTime() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function formatPHTime(dateStr) {
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

async function broadcastToAllThreads(api, quake) {
  const quakeId = quake.informationNumber || quake.timestamp;
  if (sentQuakeIDs.has(quakeId)) return;

  sentQuakeIDs.add(quakeId);

  const message = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗧𝗶𝗺𝗲: ${formatPHTime(quake.dateTime || quake.timestamp)}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${quake.location || "Unknown"}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${quake.magnitude || "N/A"}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${quake.origin || "Unknown"}
🆔 𝗜𝗻𝗳𝗼 No.: ${quake.informationNumber || "N/A"}
🔗 𝗟𝗶𝗻𝗸: ${quake.sourceUrl?.replace(/\\/g, "/") || "N/A"}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${getTimeAgo(quake.timestamp)} (PH Time)
━━━━━━━━━━━━━━━
`.trim();

  const threads = global.data?.allThreadID || [];
  console.log(`🌍 Sending quake update to ${threads.length} threads...`);

  for (const threadID of threads) {
    try {
      if (quake.mapImageUrl && global.utils?.getStreamFromURL) {
        await api.sendMessage(
          {
            body: message,
            attachment: await global.utils.getStreamFromURL(quake.mapImageUrl.replace(/\\/g, "/")),
          },
          threadID
        );
      } else {
        await api.sendMessage(message, threadID);
      }
    } catch (err) {
      console.error(`❌ Failed to send to ${threadID}:`, err.message);
    }
  }
}

async function monitorLoop(api) {
  const quake = await fetchEarthquakeData();
  if (quake) {
    await broadcastToAllThreads(api, quake);
  }
}

function startAlwaysOnMonitor(api) {
  if (monitorStarted) return;
  monitorStarted = true;

  console.log("🌐 [QUAKE] Always-on Earthquake Monitor started...");

  setInterval(() => {
    monitorLoop(api).catch(err => {
      console.error("⛔ Earthquake loop error:", err.message);
    });
  }, 15000); // every 15 seconds
}

module.exports.config = {
  name: "kquake",
  version: "3.0-alwayson",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Automatically posts all new PHIVOLCS earthquake alerts to all threads, 24/7.",
  usage: "N/A (automatic)",
  credits: "Nax + ChatGPT",
  cooldown: 0,
};

module.exports.run = async function ({ api }) {
  startAlwaysOnMonitor(api);
};
