const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "autoban",
  version: "1.0.3",
  hasPermission: 0,
  description: "Auto-ban spam & bad words sa group, admin lang pwede mag-unban, may time stamp",
  usages: "[no args]",
  cooldowns: 5
};

// List ng spam keywords + Filipino bad words
const spamKeywords = [
  "free money",
  "click here",
  "subscribe now",
  "buy now",
  "check this out",
  "spamlink.com",

  "putang ina",
  "puki",
  "gago",
  "tang ina",
  "tangina",
  "tae",
  "bobo",
  " gago ",
  "ulol",
  "tanga",
  "baka ka pa",
  "leche",
  "pakshet",
  "engkanto",
  "tarantado",
  "hayup",
  "pesteng"
];

// Path sa file na magtatrack ng banned users per thread
const banDataPath = path.join(__dirname, 'banData.json');

function loadBanData() {
  if (!fs.existsSync(banDataPath)) return {};
  return fs.readJSONSync(banDataPath);
}

function saveBanData(data) {
  fs.writeJSONSync(banDataPath, data, { spaces: 2 });
}

// Helper function para kunin ang current Philippine time string
function getPhilippineTime() {
  return new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID, body, isGroup, mentions } = event;

  if (!isGroup) return;

  let banData = loadBanData();
  if (!banData[threadID]) banData[threadID] = [];

  const lowerBody = body.toLowerCase();

  // Auto-ban kapag may spam o bad words at hindi pa banned
  const isSpam = spamKeywords.some(keyword => lowerBody.includes(keyword));
  if (isSpam && !banData[threadID].includes(senderID)) {
    try {
      await api.removeUserFromGroup(senderID, threadID);
      banData[threadID].push(senderID);
      saveBanData(banData);
      const timePH = getPhilippineTime();
      return api.sendMessage(`🚫 Auto-banned user for using prohibited words or spam.\n⏰ Time: ${timePH}`, threadID);
    } catch (err) {
      console.error("Failed to remove user:", err);
      return api.sendMessage("❌ Failed to auto-ban user. Check bot permissions.", threadID, messageID);
    }
  }

  // Command para sa unban - admin lang pwede gumamit
  if (body.startsWith("!unban")) {
    const admins = await api.getThreadAdmins(threadID);
    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Wala kang permiso para gamitin ang command na ito.", threadID, messageID);
    }

    let targetID = null;
    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.values(mentions)[0].id;
    } else if (args[0]) {
      targetID = args[0];
    } else {
      return api.sendMessage("⚠️ I-mention ang user o ilagay ang kanilang ID para ma-unban.", threadID, messageID);
    }

    if (!banData[threadID] || !banData[threadID].includes(targetID)) {
      return api.sendMessage("ℹ️ Hindi naka-ban ang user.", threadID, messageID);
    }

    try {
      await api.addUserToGroup(targetID, threadID);
      banData[threadID] = banData[threadID].filter(id => id !== targetID);
      saveBanData(banData);
      const timePH = getPhilippineTime();
      return api.sendMessage(`✅ Successfully unbanned user.\n⏰ Time: ${timePH}`, threadID);
    } catch (err) {
      console.error("Failed to add user:", err);
      return api.sendMessage("❌ Failed to unban user. Check bot permissions.", threadID, messageID);
    }
  }
};
