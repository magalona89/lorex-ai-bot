const axios = require("axios");

const activeSessions = new Map(); // threadID => lastQuakeId
const lastSentTime = new Map();   // threadID => last sent timestamp
const autoPostEnabled = new Map(); // threadID => true/false
let monitorStarted = false;

// ========== Helper Functions ==========
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

// ========== Fetch Earthquake Data ==========
async function fetchEarthquakeData() {
  try {
    const res = await axios.get("https://hutchingd-earthquake-info-philvocs-api-cc.hf.space/info");
    return res.data?.details || null;
  } catch (err) {
    console.error("[Quake] API error:", err);
    return null;
  }
}

// ========== Earthquake Checker ==========
async function checkForUpdates(api) {
  const quake = await fetchEarthquakeData();
  if (!quake) {
    for (const threadID of activeSessions.keys()) {
      await api.sendMessage("⚠️ PHIVOLCS API is currently unavailable. Monitoring will resume once it's back.", threadID);
    }
    return;
  }

  const quakeId = quake.informationNumber || quake.timestamp;
  if (!quakeId) return;

  const dateTimePH = formatPHTime(quake.dateTime || quake.timestamp);
  const timeAgo = getTimeAgo(quake.timestamp);
  const mapImg = quake.mapImageUrl?.replace(/\\/g, "/");
  const msg = `
🌋 𝗣𝗛𝗜𝗩𝗢𝗟𝗖𝗦 𝗘𝗮𝗿𝘁𝗵𝗾𝘂𝗮𝗸𝗲 𝗔𝗹𝗲𝗿𝘁
━━━━━━━━━━━━━━━
📅 𝗗𝗮𝘁𝗲 & 𝗧𝗶𝗺𝗲: ${dateTimePH}
📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻: ${quake.location || "Unknown"}
📏 𝗠𝗮𝗴𝗻𝗶𝘁𝘂𝗱𝗲: ${quake.magnitude || "N/A"}
🌐 𝗢𝗿𝗶𝗴𝗶𝗻: ${quake.origin || "Unknown"}
🆔 𝗜𝗻𝗳𝗼 𝗡𝗼.: ${quake.informationNumber || "N/A"}
🔗 𝗦𝗼𝘂𝗿𝗰𝗲: ${quake.sourceUrl || "No link"}
🕓 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱: ${timeAgo} (PH Time)
━━━━━━━━━━━━━━━
`;

  for (const [threadID, lastId] of activeSessions.entries()) {
    if (lastId === quakeId) continue;

    const now = Date.now();
    if (lastSentTime.has(threadID) && now - lastSentTime.get(threadID) < 10000) continue;

    try {
      // Send Messenger alert
      if (mapImg && global.utils?.getStreamFromURL) {
        await api.sendMessage({
          body: msg,
          attachment: await global.utils.getStreamFromURL(mapImg),
        }, threadID);
      } else {
        await api.sendMessage(msg, threadID);
      }

      // Auto-post to Facebook
      if (autoPostEnabled.get(threadID)) {
        try {
          const postUrl = await api.createPost({ body: msg.trim() });
          await api.sendMessage(`📤 Also auto-posted:\n🔗 ${postUrl || "No URL returned"}`, threadID);
        } catch (e) {
          console.error(`[Autopost Failed] ${threadID}:`, e);
          await api.sendMessage("⚠️ Earthquake alert sent, but auto-post failed.", threadID);
        }
      }

      console.log(`[QUAKE] Sent to ${threadID} | ${quake.location}`);
      activeSessions.set(threadID, quakeId);
      lastSentTime.set(threadID, now);
    } catch (err) {
      console.error(`[Send Error] Thread ${threadID}:`, err);
    }
  }
}

// ========== Start Monitor ==========
function startEarthquakeMonitor(api) {
  if (monitorStarted) return;
  monitorStarted = true;
  console.log("[⏱] Quake monitoring started...");
  setInterval(() => {
    checkForUpdates(api).catch(console.error);
  }, 15000); // every 15s
}

// ========== Command Export ==========
module.exports.config = {
  name: "kb",
  version: "3.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["lindol", "earthquake"],
  description: "PHIVOLCS auto-earthquake monitor",
  usage: "quake [on|off|status|autopost]",
  credits: "Nax + ChatGPT",
  cooldown: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const subcmd = args[0]?.toLowerCase();

  switch (subcmd) {
    case "on":
      if (activeSessions.has(threadID))
        return api.sendMessage("✅ Already monitoring in this thread.", threadID, messageID);
      activeSessions.set(threadID, null);
      autoPostEnabled.set(threadID, false); // default: auto-post off
      startEarthquakeMonitor(api);
      return api.sendMessage("📡 Quake monitoring is now **ON** for this thread.", threadID, messageID);

    case "off":
      if (!activeSessions.has(threadID))
        return api.sendMessage("🛑 Monitoring is not active in this thread.", threadID, messageID);
      activeSessions.delete(threadID);
      autoPostEnabled.delete(threadID);
      return api.sendMessage("🛑 Monitoring has been **turned OFF**.", threadID, messageID);

    case "status":
      const isActive = activeSessions.has(threadID);
      const isAutoPost = autoPostEnabled.get(threadID) === true;
      return api.sendMessage(
        `📊 Monitoring: ${isActive ? "✅ ON" : "❌ OFF"}\n📤 Auto-post: ${isAutoPost ? "✅ ON" : "❌ OFF"}`,
        threadID, messageID
      );

    case "autopost":
      const arg = args[1]?.toLowerCase();
      if (!activeSessions.has(threadID))
        return api.sendMessage("⚠️ Enable monitoring first using `quake on`.", threadID, messageID);

      if (arg === "on") {
        autoPostEnabled.set(threadID, true);
        return api.sendMessage("✅ Auto-post is now **ENABLED**.", threadID, messageID);
      } else if (arg === "off") {
        autoPostEnabled.set(threadID, false);
        return api.sendMessage("🛑 Auto-post is now **DISABLED**.", threadID, messageID);
      } else {
        const status = autoPostEnabled.get(threadID) ? "✅ ON" : "❌ OFF";
        return api.sendMessage(`📤 Auto-post status: ${status}`, threadID, messageID);
      }

    default:
      return api.sendMessage(
        "📌 Usage:\n" +
        "• quake on — start monitoring\n" +
        "• quake off — stop monitoring\n" +
        "• quake status — check current status\n" +
        "• quake autopost on/off — toggle Facebook auto-post",
        threadID,
        messageID
      );
  }
};
