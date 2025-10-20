const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsFile = path.join(__dirname, "aria_settings.json");
const adminID = "61580959514473";
let maintenanceMode = false;
let serverSuspended = false; // 🆕 Server suspension flag

const defaultSettings = {
  autoReact: true,
  boldFormat: true,
  fastMode: true,
  safeMode: true,
  profanityFilter: true,
  conversationMemory: true,
  emojiDecor: true,
  timestamp: true,
  maintenanceMode: false,
  logging: true,
  typingEdit: false,
  groupAdmin: true,
  allowKick: true,
  allowAddUser: true,
  allowRules: true,
  imageGeneration: true,
  imageEdit: true,
  poliMode: true,
  imageAnalyze: true,
  smartReply: true,
  compactOutput: false,
  showTips: true,
  errorRetry: true,
  fastResponse: true,
  maintenanceLock: false,
  ruleReminder: true,
  kickNotice: true,
  respondWithPersonality: true,
  aiHumor: true,
  aiSummarize: false,
  safeLinks: true,
  userJoinGreet: true,
  groupOnly: false,
  commandLog: true,
  adminBypass: true,
  pinRules: false,
  allowMediaResponse: true,
  autoHelp: true
};

function loadSettings() {
  if (!fs.existsSync(settingsFile))
    fs.writeJsonSync(settingsFile, defaultSettings, { spaces: 2 });
  return fs.readJsonSync(settingsFile);
}

function saveSettings(settings) {
  fs.writeJsonSync(settingsFile, settings, { spaces: 2 });
}

module.exports.config = {
  name: "aria1",
  version: "10.4.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["aria", "ariav10", "aria-ai"],
  description: "ARIA AI PRO v10.4.0 — Smart Assistant + Server Suspension System",
  usages: "aria [question/settings/update/suspend]",
  credits: "Daikyu x SwordSlush x Zetsu",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;
  let settings = loadSettings();
  const query = args.join(" ");
  const isAdmin = uid === adminID;

  // 🧱 SERVER SUSPENSION SYSTEM
  if (args[0]?.toLowerCase() === "suspend" && isAdmin) {
    const toggle = args[1]?.toLowerCase();
    if (!toggle) return api.sendMessage("⚙️ Usage: aria suspend on/off", threadID, messageID);
    serverSuspended = toggle === "on";
    return api.sendMessage(
      `🚨 Aria AI Server has been ${serverSuspended ? "SUSPENDED 🔴" : "RESUMED 🟢"} by the owner.`,
      threadID,
      messageID
    );
  }

  if (serverSuspended && !isAdmin) {
    return api.sendMessage(
      "🚫 𝗔𝗿𝗶𝗮 𝗔𝗜 𝗦𝗲𝗿𝘃𝗲𝗿 𝗦𝘂𝘀𝗽𝗲𝗻𝗱𝗲𝗱\n━━━━━━━━━━━━━━\nThe Aria AI system is temporarily suspended by the owner.\nPlease contact admin for more information.\n\n📞 Admin ID: 61580959514473",
      threadID,
      messageID
    );
  }

  // 🛠️ Maintenance Mode
  if (args[0]?.toLowerCase() === "maintaince" && isAdmin) {
    const toggle = args[1]?.toLowerCase();
    maintenanceMode = toggle === "on";
    return api.sendMessage(`🛠️ Maintenance ${maintenanceMode ? "Activated" : "Deactivated"}`, threadID, messageID);
  }
  if (maintenanceMode && !isAdmin)
    return api.sendMessage("🚧 Aria AI PRO is under maintenance.", threadID, messageID);

  // 🆕 UPDATE LOG
  if (args[0]?.toLowerCase() === "update" || args[0]?.toLowerCase() === "version") {
    const updateMessage = [
      "💠 *ARIA AI PRO — Updates & Features*",
      "━━━━━━━━━━━━━━━━━━━",
      "",
      "🧩 *Version History:*",
      "🔹 v1.0 — Aria Alpha (Base AI)",
      "🔹 v5.0 — Admin Tools & Rules System",
      "🔹 v7.0 — Image Analysis & Generation",
      "🔹 v9.0 — Aria PRO Revamp (Fast Mode)",
      "🔹 v10.3 — Update Log + Coming Soon Panel",
      "🔹 v10.4 — Added Server Suspension System",
      "",
      "⚙️ *Current Features:*",
      "✅ Smart AI Chat + SwordSlush API",
      "✅ Group Admin Commands",
      "✅ AutoReact, Safe Mode, Profanity Filter",
      "✅ Maintenance & Server Suspension Modes",
      "",
      "🚀 *Coming Soon:*",
      "🔸 Aria Voice Chat (beta)",
      "🔸 User Memory Profiles",
      "🔸 Aria Web Dashboard (Cloud Control)",
      "🔸 Role-based Admin Permissions",
      "",
      "📅 *Last Update:* October 2025",
      "",
      "✨ *Powered by SwordSlush Engine x Daikyu Systems*"
    ].join("\n");
    return api.sendMessage(updateMessage, threadID, messageID);
  }

  // 💬 AI Response
  if (!query)
    return api.sendMessage(
      "🤖 Aria AI PRO v10.4.0 Online!\nType: `aria update` to view all versions & features 💡",
      threadID,
      messageID
    );

  if (settings.autoReact) api.setMessageReaction("💠", messageID, () => {}, true);

  try {
    const { data } = await axios.get(
      `https://betadash-api-swordslush-production.up.railway.app/assistant?chat=${encodeURIComponent(query)}`
    );
    const response = data.response || data.answer || "⚠️ No reply from Aria Assistant.";

    api.sendMessage(
      `💠 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 𝗔𝗜\n━━━━━━━━━━━━━━\n${response}\n\n🧠 Powered by SwordSlush API`,
      threadID,
      messageID
    );
  } catch (e) {
    api.sendMessage("❌ API Error. Try again later.", threadID, messageID);
  }
};
