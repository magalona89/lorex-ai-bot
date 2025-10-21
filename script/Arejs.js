const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const settingsFile = path.join(__dirname, "aria_settings.json");
const adminID = "61580959514473";
let maintenanceMode = false;
let suspendedServer = false;

const defaultSettings = {
  version: "24.0.0",
  adminContact: "https://facebook.com/profile.php?id=61580959514473",
  suspended: false,
  userPlans: {},
  autoReact: true,
  fastMode: true,
  safeMode: true,
  groupAdmin: true,
  allowKick: true,
  allowAddUser: true,
  allowRules: true,
  aiHumor: true,
  smartReply: true,
  showTips: true,
  maintenanceMode: false
};

function loadSettings() {
  if (!fs.existsSync(settingsFile))
    fs.writeJsonSync(settingsFile, defaultSettings, { spaces: 2 });
  return fs.readJsonSync(settingsFile);
}
function saveSettings(settings) {
  fs.writeJsonSync(settingsFile, settings, { spaces: 2 });
}
function resetExpiredPlans(settings) {
  const now = Date.now();
  for (const uid in settings.userPlans) {
    const plan = settings.userPlans[uid];
    if (plan.lastReset && now - plan.lastReset > 24 * 60 * 60 * 1000) {
      if (plan.type === "Free") plan.messagesUsed = 0;
      if (plan.type === "Trial" && now - plan.lastReset > 24 * 60 * 60 * 1000) {
        plan.type = "Free";
        plan.plan = "Basic 🌱";
        plan.messagesUsed = 0;
      }
      plan.lastReset = now;
    }
  }
  saveSettings(settings);
}

module.exports.config = {
  name: "aria1",
  version: "24.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["aria", "ariaai", "megaaria"],
  description: "🤖 ARIA PRO MEGA v24 — AI Assistant with Free, Trial, and Premium plans",
  usages: "aria [query/settings/plans/select plan/profile]",
  credits: "Daikyu x Rapido x Zetsu",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;
  const name = event.senderName || "User";
  const query = args.join(" ");
  const isAdmin = uid === adminID;
  let settings = loadSettings();

  resetExpiredPlans(settings);

  if (settings.suspended || suspendedServer)
    return api.sendMessage(
      "🚫 ARIA AI SERVER IS CURRENTLY SUSPENDED.\n━━━━━━━━━━━\n⚙️ Suspended by the owner for upgrades.\n📩 Contact admin:\n" + settings.adminContact,
      threadID,
      messageID
    );

  // MAINTENANCE MODE
  if (args[0]?.toLowerCase() === "maintenance" && isAdmin) {
    maintenanceMode = args[1]?.toLowerCase() === "on";
    return api.sendMessage(`🛠️ Maintenance ${maintenanceMode ? "Activated" : "Deactivated"}`, threadID, messageID);
  }
  if (maintenanceMode && !isAdmin)
    return api.sendMessage("🚧 ARIA PRO is under maintenance.", threadID, messageID);

  // PLANS LIST
  if (["plans", "plan"].includes(args[0]?.toLowerCase())) {
    return api.sendMessage(
      `💎 𝗔𝗥𝗜𝗔 𝗣𝗟𝗔𝗡𝗦 — v${settings.version}\n━━━━━━━━━━━\n` +
      `🆓 𝗙𝗥𝗘𝗘 — 10 msgs/day (Basic features)\n` +
      `🎁 𝗧𝗥𝗜𝗔𝗟 — 24 hours unlimited (Preview premium)\n` +
      `👑 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 — Unlimited + Fast Response + Image Tools + Smart Memory\n━━━━━━━━━━━\n` +
      `📅 Free resets daily.\n📩 Upgrade using:\n• aria upgrade trial\n• aria upgrade premium\n━━━━━━━━━━━\n` +
      `👥 Admin: ${settings.adminContact}`,
      threadID,
      messageID
    );
  }

  // SELECT FREE PLAN
  if (args[0]?.toLowerCase() === "select" && args[1]?.toLowerCase() === "plan") {
    const planNum = parseInt(args[2]);
    const plans = [
      "Basic 🌱",
      "Lite 💫",
      "Student 🎓",
      "Fun 😄",
      "Chill 🍃",
      "Smart 💡",
      "Gamer 🎮",
      "Artist 🎨",
      "Tech ⚙️",
      "Mix 🧩"
    ];
    if (isNaN(planNum) || planNum < 1 || planNum > plans.length)
      return api.sendMessage("⚠️ Please choose 1–10.\nExample: aria select plan 3", threadID, messageID);
    const selected = plans[planNum - 1];
    settings.userPlans[uid] = {
      name,
      uid,
      type: "Free",
      plan: selected,
      messagesUsed: 0,
      lastReset: Date.now()
    };
    saveSettings(settings);
    return api.sendMessage(
      `✅ ${name}, you’re now using:\n🆓 ${selected}\n━━━━━━━━━━━\n💬 Limit: 10 messages/day\nType anything to start!`,
      threadID,
      messageID
    );
  }

  // UPGRADE COMMANDS
  if (args[0]?.toLowerCase() === "upgrade") {
    const choice = args[1]?.toLowerCase();
    if (choice === "trial") {
      settings.userPlans[uid] = {
        name,
        uid,
        type: "Trial",
        plan: "Trial 🎁",
        messagesUsed: 0,
        lastReset: Date.now()
      };
      saveSettings(settings);
      return api.sendMessage(
        `🎁 Trial activated for ${name}!\n━━━━━━━━━━━\n⏳ Duration: 24 hours\n🚀 Unlimited messages unlocked!`,
        threadID,
        messageID
      );
    }
    if (choice === "premium") {
      settings.userPlans[uid] = {
        name,
        uid,
        type: "Premium",
        plan: "Premium 👑",
        messagesUsed: 0,
        lastReset: Date.now()
      };
      saveSettings(settings);
      return api.sendMessage(
        `👑 Premium Activated!\n━━━━━━━━━━━\nWelcome ${name}!\nEnjoy:\n• Unlimited AI Access\n• Fast Mode ⚡\n• Smart Memory 🧠\n• Creative Tools 🎨`,
        threadID,
        messageID
      );
    }
  }

  // PROFILE DASHBOARD
  if (args[0]?.toLowerCase() === "profile") {
    const user = settings.userPlans[uid];
    if (!user)
      return api.sendMessage(
        `👋 You don’t have a plan yet.\nType:\n→ aria plans\n→ aria select plan 1`,
        threadID,
        messageID
      );
    return api.sendMessage(
      `📊 𝗔𝗥𝗜𝗔 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗\n━━━━━━━━━━━\n👤 Name: ${user.name}\n🪪 UID: ${uid}\n🔗 FB: https://facebook.com/${uid}\n💠 Plan: ${user.plan}\n🏷️ Type: ${user.type}\n💬 Used: ${user.messagesUsed}${user.type === "Free" ? "/10" : ""}\n📅 Last Reset: ${new Date(user.lastReset).toLocaleString()}\n━━━━━━━━━━━\n⚙️ Type 'aria plans' for upgrade options.`,
      threadID,
      messageID
    );
  }

  // CHECK PLAN EXISTENCE
  const userPlan = settings.userPlans[uid];
  if (!userPlan)
    return api.sendMessage(
      `👋 Hi ${name}!\nYou don’t have a plan yet.\nType:\n→ aria plans\n→ aria select plan 1`,
      threadID,
      messageID
    );

  // MESSAGE LIMIT (Free only)
  if (userPlan.type === "Free" && userPlan.messagesUsed >= 10) {
    return api.sendMessage(
      `⚠️ ${name}, you’ve reached your 10-message daily limit.\n💡 Type 'aria upgrade trial' or 'aria upgrade premium' to unlock unlimited messages.`,
      threadID,
      messageID
    );
  }

  // MAIN CHAT
  if (!query)
    return api.sendMessage(
      `🤖 𝗔𝗥𝗜𝗔 𝗣𝗥𝗢 𝗠𝗘𝗚𝗔 v${settings.version}\n━━━━━━━━━━━\nType your message or use:\n• aria plans\n• aria profile\n• aria upgrade trial\n• aria upgrade premium`,
      threadID,
      messageID
    );

  if (settings.autoReact) api.setMessageReaction("⚡", messageID, () => {}, true);

  try {
    const { data } = await axios.get(
      `https://betadash-api-swordslush-production.up.railway.app/assistant?chat=${encodeURIComponent(query)}`
    );

    const response = data.response || "⚠️ No response.";

    if (userPlan.type === "Free") userPlan.messagesUsed++;
    saveSettings(settings);

    const msg =
      `✨ 𝗔𝗥𝗜𝗔 ${userPlan.plan}\n━━━━━━━━━━━\n${response}\n━━━━━━━━━━━\n💬 Used: ${userPlan.messagesUsed}${userPlan.type === "Free" ? "/10" : ""}\n🏷️ Type: ${userPlan.type}\n📎 UID: ${uid}`;
    api.sendMessage(msg, threadID, messageID);
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ ARIA AI server error. Please try again later.", threadID, messageID);
  }
};
