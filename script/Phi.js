const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsFile = path.join(__dirname, "phi_settings.json");
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

// 🧩 Load & Save Settings
function loadSettings() {
  try {
    if (!fs.existsSync(settingsFile)) {
      fs.writeJsonSync(settingsFile, defaultSettings, { spaces: 2 });
    }
    return fs.readJsonSync(settingsFile);
  } catch (err) {
    console.error("❌ Failed to load settings:", err);
    return defaultSettings;
  }
}

function saveSettings(settings) {
  try {
    fs.writeJsonSync(settingsFile, settings, { spaces: 2 });
  } catch (err) {
    console.error("❌ Failed to save settings:", err);
  }
}

// ✨ Bold Formatting Function
function bold(text) {
  const map = {
    a:'𝗮',b:'𝗯',c:'𝗰',d:'𝗱',e:'𝗲',f:'𝗳',g:'𝗴',h:'𝗵',i:'𝗶',j:'𝗷',
    k:'𝗸',l:'𝗹',m:'𝗺',n:'𝗻',o:'𝗼',p:'𝗽',q:'𝗾',r:'𝗿',s:'𝘀',t:'𝘁',
    u:'𝘂',v:'𝘃',w:'𝘄',x:'𝘅',y:'𝘆',z:'𝘇'
  };
  return text.split("").map(ch => map[ch.toLowerCase()] || ch).join("");
}

module.exports.config = {
  name: "phi",
  version: "10.1.1",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["phiai", "phi-pro", "phi10"],
  description: "PHI AI PRO v10 — Smart Chat + Group Admin + Settings System",
  usages: "phi [question/settings/kick/adduser/rules/update]",
  credits: "SwordSlush x Daikyu x Zetsu (Updated by Rynxx)",
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
  if (args[0]?.toLowerCase() === "maintenance" && isAdmin) {
    const toggle = args[1]?.toLowerCase();
    maintenanceMode = toggle === "on";
    return api.sendMessage(`🛠️ Maintenance ${maintenanceMode ? "Activated" : "Deactivated"}`, threadID, messageID);
  }
  if (maintenanceMode && !isAdmin)
    return api.sendMessage("🚧 PHI AI PRO is currently under maintenance.", threadID, messageID);

  // ⚙️ Settings Panel
  if (args[0]?.toLowerCase() === "settings") {
    if (args[1]?.toLowerCase() === "list") {
      const list = Object.entries(settings)
        .map(([k, v]) => `${v ? "✅" : "❌"} ${k}`)
        .join("\n");
      return api.sendMessage(`⚙️ 𝗣𝗛𝗜 𝗣𝗥𝗢 𝗦𝗲𝘁𝘁𝗶𝗻𝗴𝘀\n━━━━━━━━━━━━━━\n${list}`, threadID, messageID);
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

  // 🔄 Update / Version Info
  if (args[0]?.toLowerCase() === "update" || args[0]?.toLowerCase() === "version") {
    const updateMessage = [
      "💠 *PHI AI PRO — Version History*",
      "━━━━━━━━━━━━━━━━━━━",
      "",
      "🆕 *v10.1.1 (Current)*",
      "🔹 Switched to Gemini Vision API (Rynxx)",
      "🔹 Better stability and error handling",
      "🔹 Maintenance command fixed",
      "",
      "⚙️ *v10.0.0*",
      "🔹 39 Settings System added",
      "🔹 Group Admin features (kick, adduser, rules)",
      "🔹 AI Humor + Profanity Filter",
      "",
      "✨ *Powered by PHI AI x SwordSlush x Rynxx*"
    ].join("\n");

    return api.sendMessage(updateMessage, threadID, messageID);
  }

  // 👮 Group Admin Commands
  if (settings.groupAdmin && event.isGroup) {
    // Kick user
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

    // Add user
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

    // Rules
    if (args[0]?.toLowerCase() === "rules" && settings.allowRules) {
      return api.sendMessage(
        `📜 𝗚𝗿𝗼𝘂𝗽 𝗥𝘂𝗹𝗲𝘀\n━━━━━━━━━━━━━━\n1. No spamming\n2. No bullying\n3. Respect others\n4. Keep chat clean\n5. Follow admin instructions`,
        threadID,
        messageID
      );
    }
  }

  // 💬 Main PHI Chat
  if (!query)
    return api.sendMessage(
      "🤖 PHI AI PRO v10.1.1 is online!\nType your question or use:\n`phi settings list`, `phi rules`, `phi kick`, `phi adduser`, `phi update`",
      threadID,
      messageID
    );

  if (settings.autoReact) api.setMessageReaction("🚀", messageID, () => {}, true);

  try {
    // ✅ Updated API Endpoint (Rynxx Gemini Vision)
    const { data } = await axios.get(
      `https://api-rynxx.onrender.com/api/gemini-vision?prompt=${encodeURIComponent(query)}&uid=${uid}&imgUrl=`
    );

    let response = data.response || data.answer || "⚠️ Walang sagot mula sa Gemini Vision API.";
    if (settings.boldFormat)
      response = response.replace(/\*\*(.*?)\*\*/g, (_, t) => bold(t));

    const msg = `💠 𝗣𝗛𝗜 𝗣𝗥𝗢 (${settings.fastMode ? "⚡ Fast" : "Normal"})\n━━━━━━━━━━━━━━\n${response}`;
    api.sendMessage(msg, threadID, () => {
      if (settings.autoReact) api.setMessageReaction("💡", messageID, () => {}, true);
    });

  } catch (e) {
    console.error("PHI API Error:", e.message);
    api.sendMessage("❌ Gemini Vision API error. Please try again later.", threadID, messageID);
  }
};
