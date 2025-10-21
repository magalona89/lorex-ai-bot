const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsFile = path.join(__dirname, "aria_settings.json");
const adminID = "61580959514473";
let maintenanceMode = false;

// Load settings
function loadSettings() {
  if (!fs.existsSync(settingsFile)) {
    const defaultSettings = { serverSuspended: false, maintenanceMode: false };
    fs.writeJsonSync(settingsFile, defaultSettings, { spaces: 2 });
  }
  return fs.readJsonSync(settingsFile);
}
function saveSettings(settings) {
  fs.writeJsonSync(settingsFile, settings, { spaces: 2 });
}

module.exports.config = {
  name: "aria1",
  version: "18.5.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["aria", "pro", "aria18"],
  description: "ARIA PRO v18.5 — AI Chat + Group Admin + Profile UID Lookup + Uptime Monitor",
  usages: "aria [message/settings/update/profile/uid]",
  credits: "Daikyu x Rapido x Zetsu x ARIA PRO",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  const settings = loadSettings();
  const isAdmin = senderID === adminID;
  const query = args.join(" ").trim();

  // 🛑 Server Suspended
  if (settings.serverSuspended) {
    return api.sendMessage(
      "⚠️ 𝗔𝗿𝗶𝗮 𝗣𝗿𝗼 𝗦𝗲𝗿𝘃𝗲𝗿 𝗦𝘂𝘀𝗽𝗲𝗻𝗱𝗲𝗱\n━━━━━━━━━━━━━━\nServer is temporarily suspended by the owner.\nPlease contact admin to restore service.\n👑 Admin: https://facebook.com/profile.php?id=" +
        adminID,
      threadID,
      messageID
    );
  }

  // 🧱 Maintenance Mode
  if (args[0]?.toLowerCase() === "maintenance" && isAdmin) {
    const toggle = args[1]?.toLowerCase();
    maintenanceMode = toggle === "on";
    settings.maintenanceMode = maintenanceMode;
    saveSettings(settings);
    return api.sendMessage(
      `🛠️ Maintenance ${maintenanceMode ? "Activated" : "Deactivated"}.`,
      threadID,
      messageID
    );
  }
  if (maintenanceMode && !isAdmin)
    return api.sendMessage("🚧 Aria PRO is currently under maintenance.", threadID, messageID);

  // ⚙️ Settings List
  if (args[0]?.toLowerCase() === "settings") {
    if (args[1]?.toLowerCase() === "list") {
      const list = Object.entries(settings)
        .map(([k, v]) => `${v ? "✅" : "❌"} ${k}`)
        .join("\n");
      return api.sendMessage(`⚙️ 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 𝗦𝗲𝘁𝘁𝗶𝗻𝗴𝘀\n━━━━━━━━━━━━━━\n${list}`, threadID, messageID);
    }
  }

  // 🆙 Update Info
  if (args[0]?.toLowerCase() === "update") {
    return api.sendMessage(
      `🚀 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 v18.5 — Update Log
━━━━━━━━━━━━━━
✅ Added UID Lookup from Profile Link  
✅ Added Server Uptime Tracker  
✅ Added Auto Restart Notice  
✅ Optimized API Response  
✅ Improved Maintenance Toggle  
✅ Group Admin & Rules Enhanced  
━━━━━━━━━━━━━━
📡 API: betadash-api-swordslush-production.up.railway.app
👑 Developer: Daikyu x Rapido x Zetsu
⚙️ Command: aria [message/settings/update/profile/uid]`,
      threadID,
      messageID
    );
  }

  // 📜 Rules
  if (args[0]?.toLowerCase() === "rules") {
    return api.sendMessage(
      `📜 𝗚𝗿𝗼𝘂𝗽 𝗥𝘂𝗹𝗲𝘀
━━━━━━━━━━━━━━
1️⃣ Respect everyone
2️⃣ No spam or flood
3️⃣ No NSFW or hate speech
4️⃣ Follow admins
5️⃣ Enjoy chatting with ARIA responsibly 💫`,
      threadID,
      messageID
    );
  }

  // 🆔 UID Lookup
  if (args[0]?.toLowerCase() === "uid") {
    const link = args[1];
    if (!link) return api.sendMessage("🔗 Example: aria uid https://facebook.com/zuck", threadID, messageID);

    try {
      const res = await axios.get(`https://api.simsimi.xyz/api/fbuid?url=${encodeURIComponent(link)}`);
      const uid = res.data.uid;
      if (!uid) return api.sendMessage("❌ Unable to get UID from that link.", threadID, messageID);
      return api.sendMessage(`👤 Facebook UID of ${link}\n🆔 UID: ${uid}`, threadID, messageID);
    } catch (err) {
      return api.sendMessage("⚠️ Failed to fetch UID. Try again later.", threadID, messageID);
    }
  }

  // 🔁 Uptime Monitor (Admin Only)
  if (args[0]?.toLowerCase() === "uptime" && isAdmin) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return api.sendMessage(
      `🕒 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 𝗨𝗽𝘁𝗶𝗺𝗲\n━━━━━━━━━━━━━━\n${hours}h ${minutes}m ${seconds}s`,
      threadID,
      messageID
    );
  }

  // 👢 Kick / Add User (Group)
  if (args[0]?.toLowerCase() === "kick" && event.isGroup) {
    if (!event.messageReply)
      return api.sendMessage("⚠️ Reply to a user to kick them.", threadID, messageID);
    const target = event.messageReply.senderID;
    try {
      await api.removeUserFromGroup(target, threadID);
      return api.sendMessage("👢 User kicked successfully.", threadID, messageID);
    } catch {
      return api.sendMessage("❌ Failed to remove user.", threadID, messageID);
    }
  }

  if (args[0]?.toLowerCase() === "adduser" && event.isGroup) {
    const userID = args[1];
    if (!userID)
      return api.sendMessage("⚠️ Provide a UID to add.", threadID, messageID);
    try {
      await api.addUserToGroup(userID, threadID);
      return api.sendMessage(`👤 User ${userID} added successfully.`, threadID, messageID);
    } catch {
      return api.sendMessage("❌ Failed to add user.", threadID, messageID);
    }
  }

  // 🤖 Main AI Chat
  if (!query)
    return api.sendMessage(
      "💫 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 v18.5 is online!\nType `aria hello`, `aria settings list`, or `aria update`",
      threadID,
      messageID
    );

  api.setMessageReaction("🤖", messageID, () => {}, true);

  try {
    const res = await axios.get(
      `https://betadash-api-swordslush-production.up.railway.app/assistant?chat=${encodeURIComponent(query)}`
    );

    const response = res.data.response || "I couldn’t process that right now.";
    const msg = `💫 𝗔𝗿𝗶𝗮 𝗣𝗥𝗢 v18.5\n━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━\n⚙️ Fast Mode: On | Uptime Ready`;

    api.sendMessage(msg, threadID, () => {
      api.setMessageReaction("✨", messageID, () => {}, true);
    });
  } catch (err) {
    console.error("Aria API Error:", err.message);
    api.sendMessage("❌ AI service error. Try again later.", threadID, messageID);
  }
};
