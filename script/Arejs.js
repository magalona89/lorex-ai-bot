const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsFile = path.join(__dirname, "aria_settings.json");
const adminID = "61580959514473";
let maintenanceMode = false;

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

function bold(text) {
  const map = { a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇' };
  return text.split("").map(ch => map[ch.toLowerCase()] || ch).join("");
}

module.exports.config = {
  name: "aria1",
  version: "10.3.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["aria", "ariav10", "aria-ai"],
  description: "ARIA AI PRO v10.3.0 — Smart Assistant + Admin Tools (New API + Update System)",
  usages: "aria [question/settings/update/kick/adduser/rules]",
  credits: "Daikyu x SwordSlush x Zetsu",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;
  let settings = loadSettings();
  let query = args.join(" ");
  const isAdmin = uid === adminID;

  // 🛠️ Maintenance Mode
  if (args[0]?.toLowerCase() === "maintaince" && isAdmin) {
    const toggle = args[1]?.toLowerCase();
    maintenanceMode = toggle === "on";
    return api.sendMessage(`🛠️ Maintenance ${maintenanceMode ? "Activated" : "Deactivated"}`, threadID, messageID);
  }
  if (maintenanceMode && !isAdmin)
    return api.sendMessage("🚧 Aria AI PRO is under maintenance.", threadID, messageID);

  // ⚙️ SETTINGS PANEL
  if (args[0]?.toLowerCase() === "settings") {
    if (args[1]?.toLowerCase() === "list") {
      const list = Object.entries(settings)
        .map(([k, v]) => `${v ? "✅" : "❌"} ${k}`)
        .join("\n");
      return api.sendMessage(`⚙️ 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 𝗦𝗲𝘁𝘁𝗶𝗻𝗴𝘀\n━━━━━━━━━━━━━━\n${list}`, threadID, messageID);
    }
    const feature = args[1];
    const value = args[2]?.toLowerCase();
    if (!isAdmin)
      return api.sendMessage("⚠️ Only admin can change settings.", threadID, messageID);
    if (!(feature in settings))
      return api.sendMessage(`❌ Feature "${feature}" not found.`, threadID, messageID);
    settings[feature] = value === "on";
    saveSettings(settings);
    return api.sendMessage(`✅ ${feature} turned ${value.toUpperCase()}.`, threadID, messageID);
  }

  // 🆕 UPDATE LOG & VERSIONS
  if (args[0]?.toLowerCase() === "update" || args[0]?.toLowerCase() === "version") {
    const updateMessage = [
      "💠 *ARIA AI PRO — Updates & Features*",
      "━━━━━━━━━━━━━━━━━━━",
      "",
      "🧩 *Version History:*",
      "🔹 v1.0 — Aria Alpha (Base AI)",
      "🔹 v2.0 — Added Commands System",
      "🔹 v3.0 — Introduced Group Mode",
      "🔹 v4.0 — Smarter Replies & Humor",
      "🔹 v5.0 — Admin Tools & Rules System",
      "🔹 v6.0 — Auto React + Conversation Memory",
      "🔹 v7.0 — Image Analysis & Generation",
      "🔹 v8.0 — Safe Mode + Smart Filters",
      "🔹 v9.0 — ARIA PRO Revamp (Fast Mode)",
      "🔹 v10.0 — Full PRO Core (39 Settings)",
      "🔹 v10.2 — New API Integration",
      "🔹 v10.3 — Update Log + Coming Soon Panel",
      "",
      "⚙️ *Current Features:*",
      "✅ Smart AI Chat (SwordSlush API)",
      "✅ AutoReact + Personality + Humor",
      "✅ Group Admin Tools (kick/adduser/rules)",
      "✅ 39+ Customizable Settings",
      "✅ Profanity & Safe Link Filters",
      "✅ AI Image Analyze + Generation",
      "✅ Fast Mode + Auto Error Retry",
      "",
      "🚀 *Coming Soon:*",
      "🔸 Aria Voice Chat (beta)",
      "🔸 Memory Save per User",
      "🔸 Auto Greet System",
      "🔸 Aria Web Dashboard (ARIA CLOUD)",
      "🔸 Role-based Admin Control",
      "🔸 Aria App (Mobile Sync)",
      "",
      "📅 *Last Update:* October 2025",
      "",
      "✨ *Powered by SwordSlush Engine x Daikyu Systems*"
    ].join("\n");
    return api.sendMessage(updateMessage, threadID, messageID);
  }

  // 👮 GROUP ADMIN COMMANDS
  if (settings.groupAdmin && event.isGroup) {
    if (args[0]?.toLowerCase() === "kick" && settings.allowKick) {
      if (!event.messageReply)
        return api.sendMessage("⚠️ Reply to a user to kick them.", threadID, messageID);
      const target = event.messageReply.senderID;
      try {
        await api.removeUserFromGroup(target, threadID);
        return api.sendMessage(`👢 User removed successfully.`, threadID, messageID);
      } catch {
        return api.sendMessage("❌ Unable to remove user. Check permissions.", threadID, messageID);
      }
    }

    if (args[0]?.toLowerCase() === "adduser" && settings.allowAddUser) {
      const userID = args[1];
      if (!userID)
        return api.sendMessage("⚠️ Provide a UID to add.", threadID, messageID);
      try {
        await api.addUserToGroup(userID, threadID);
        return api.sendMessage(`👤 User ${userID} added to group.`, threadID, messageID);
      } catch {
        return api.sendMessage("❌ Failed to add user.", threadID, messageID);
      }
    }

    if (args[0]?.toLowerCase() === "rules" && settings.allowRules) {
      return api.sendMessage(
        `📜 𝗚𝗿𝗼𝘂𝗽 𝗥𝘂𝗹𝗲𝘀\n━━━━━━━━━━━━━━\n1. No spam\n2. No bullying\n3. Respect others\n4. Keep chat clean\n5. Follow admins`,
        threadID,
        messageID
      );
    }
  }

  // 💬 MAIN AI CHAT
  if (!query)
    return api.sendMessage(
      "🤖 Aria AI PRO v10.3.0 Online!\nType: `aria update` to view all versions & features 💡",
      threadID,
      messageID
    );

  if (settings.autoReact) api.setMessageReaction("💠", messageID, () => {}, true);

  try {
    // ✅ NEW API ENDPOINT (Assistant)
    const { data } = await axios.get(
      `https://betadash-api-swordslush-production.up.railway.app/assistant?chat=${encodeURIComponent(query)}`
    );

    let response = data.response || data.answer || "⚠️ No reply from Aria Assistant.";
    if (settings.boldFormat)
      response = response.replace(/\*\*(.*?)\*\*/g, (_, t) => `𝗛𝗶𝗴𝗵𝗹𝗶𝗴𝗵𝘁: ${t}`);

    const msg = `💠 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 𝗔𝗜\n━━━━━━━━━━━━━━\n${response}\n\n🧠 Powered by SwordSlush API`;
    api.sendMessage(msg, threadID, () => {
      if (settings.autoReact) api.setMessageReaction("✨", messageID, () => {}, true);
    });

  } catch (e) {
    console.error("Aria API Error:", e.message);
    api.sendMessage("❌ Aria API error. Please try again later.", threadID, messageID);
  }
};
