
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "autoban",
  version: "2.0.0",
  hasPermission: 0,
  description: "Auto-ban bad words 24/7 sa lahat ng groups",
  usages: "Auto-running | !unban @user",
  cooldowns: 0,
  credits: "Admin"
};

// Comprehensive Filipino bad words list
const badWords = [
  // Original spam keywords
  "free money",
  "click here",
  "subscribe now",
  "buy now",
  "check this out",
  "spamlink.com",
  
  // Filipino bad words
  "putang ina",
  "putangina",
  "puta",
  "puki",
  "gago",
  "tang ina",
  "tangina",
  "tae",
  "bobo",
  "ulol",
  "tanga",
  "leche",
  "pakshet",
  "pakyu",
  "fuck",
  "tarantado",
  "hayup",
  "peste",
  "pesteng yawa",
  "yawa",
  "bwisit",
  "punyeta",
  "kingina",
  "kantot",
  "jakol",
  "tamod",
  "bayag",
  "bilat",
  "burat",
  "titi",
  "pepe",
  "ratbu",
  "hinayupak",
  "gaga",
  "engot",
  "inutil",
  "walang kwenta",
  "putragis",
  "pokpok",
  "shunga",
  "hangal",
  "gunggong",
  "walanghiya",
  "kupal"
];

const banDataPath = path.join(__dirname, '../banData.json');

function loadBanData() {
  if (!fs.existsSync(banDataPath)) {
    fs.writeJSONSync(banDataPath, {});
    return {};
  }
  return fs.readJSONSync(banDataPath);
}

function saveBanData(data) {
  fs.writeJSONSync(banDataPath, data, { spaces: 2 });
}

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

// Main event handler - runs 24/7
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body, isGroup } = event;

  // Only monitor group chats
  if (!isGroup || !body) return;

  let banData = loadBanData();
  if (!banData[threadID]) banData[threadID] = [];

  // Check if user is already banned
  if (banData[threadID].includes(senderID)) return;

  const lowerBody = body.toLowerCase();

  // Check for bad words
  const foundBadWord = badWords.find(word => lowerBody.includes(word.toLowerCase()));
  
  if (foundBadWord) {
    try {
      // Get thread admins to avoid banning them
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
      
      // Don't ban group admins
      if (isAdmin) {
        return api.sendMessage(
          `⚠️ Admin detected using bad word: "${foundBadWord}"\n💬 Please set a good example for the group.`,
          threadID
        );
      }

      // Remove user from group
      await api.removeUserFromGroup(senderID, threadID);
      
      // Add to ban list
      banData[threadID].push(senderID);
      saveBanData(banData);
      
      const timePH = getPhilippineTime();
      
      return api.sendMessage(
        `🚫 AUTO-BAN ACTIVATED\n` +
        `👤 User has been removed\n` +
        `⚠️ Reason: Used prohibited word "${foundBadWord}"\n` +
        `⏰ Time: ${timePH}\n` +
        `📋 Only admins can unban using: !unban @user`,
        threadID
      );
    } catch (err) {
      console.error("Auto-ban error:", err);
      return api.sendMessage(
        "❌ Failed to auto-ban user. Bot may need admin permissions.",
        threadID
      );
    }
  }
};

// Command handler for unban
module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID, mentions } = event;

  // Check if user is admin
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);

  if (!isAdmin) {
    return api.sendMessage(
      "❌ Only group admins can unban users.",
      threadID,
      messageID
    );
  }

  let banData = loadBanData();
  
  // Get target user ID
  let targetID = null;
  if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (args[0]) {
    targetID = args[0];
  } else {
    return api.sendMessage(
      "⚠️ Usage: !unban @user or !unban <userID>",
      threadID,
      messageID
    );
  }

  // Check if user is banned
  if (!banData[threadID] || !banData[threadID].includes(targetID)) {
    return api.sendMessage(
      "ℹ️ User is not in the ban list.",
      threadID,
      messageID
    );
  }

  try {
    // Add user back to group
    await api.addUserToGroup(targetID, threadID);
    
    // Remove from ban list
    banData[threadID] = banData[threadID].filter(id => id !== targetID);
    saveBanData(banData);
    
    const timePH = getPhilippineTime();
    
    return api.sendMessage(
      `✅ User successfully unbanned\n⏰ Time: ${timePH}\n⚠️ Please follow group rules.`,
      threadID
    );
  } catch (err) {
    console.error("Unban error:", err);
    return api.sendMessage(
      "❌ Failed to unban user. They may have blocked the bot or left Facebook.",
      threadID,
      messageID
    );
  }
};
