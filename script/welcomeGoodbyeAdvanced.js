const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "welcome",
  version: "1.1.0",
  hasPermission: 0,
  description: "Auto welcome/goodbye with image and delay",
  usages: "",
  cooldowns: 5
};

// Helper function for delay (ms)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.run = async function({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;

  // Path ng images (pwedeng palitan ng image URLs kung gusto)
  const welcomeImagePath = path.join(__dirname, 'welcome.png');
  const goodbyeImagePath = path.join(__dirname, 'goodbye.png');

  if (logMessageType === "log:subscribe") {
    const userIDs = logMessageData.addedParticipants.map(p => p.userFbId || p.userID);
    for (const userID of userIDs) {
      await delay(2000); // 2 seconds delay para natural
      api.sendMessage({
        body: `👋 Welcome sa group, @${userID}! Enjoy your stay! 😊`,
        mentions: [{ tag: `@${userID}`, id: userID }],
        attachment: fs.createReadStream(welcomeImagePath)
      }, threadID);
    }
  }

  if (logMessageType === "log:unsubscribe") {
    const userIDs = logMessageData.leftParticipants.map(p => p.userFbId || p.userID);
    for (const userID of userIDs) {
      await delay(2000); // 2 seconds delay
      api.sendMessage({
        body: `😢 Goodbye @${userID}, salamat sa pag-join!`,
        mentions: [{ tag: `@${userID}`, id: userID }],
        attachment: fs.createReadStream(goodbyeImagePath)
      }, threadID);
    }
  }
};
