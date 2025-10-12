const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "welcome",
  version: "1.0.0",
  hasPermission: 0,
  credits: "urangkapolka API | Modified by ChatGPT",
  description: "Auto welcome with image when a new member joins.",
  usages: "Automatic",
  cooldowns: 0,
};

module.exports.handleEvent = async function ({ event, api }) {
  if (event.logMessageType !== "log:subscribe") return;

  const threadID = event.threadID;
  const newUserID = event.logMessageData.addedParticipants[0].userFbId;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const memberCount = threadInfo.participantIDs.length;
    const groupName = threadInfo.threadName || "this group";

    const userInfo = await api.getUserInfo(newUserID);
    const username = userInfo[newUserID].name;

    const avatarUrl = `https://graph.facebook.com/${newUserID}/picture?width=512&height=512`;
    const bg = "https://i.imgur.com/qb0K8kv.jpg"; // Palitan mo kung gusto mo ng custom background

    const apiURL = `https://urangkapolka.vercel.app/api/welcome?username=${encodeURIComponent(username)}&avatarUrl=${encodeURIComponent(avatarUrl)}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(bg)}&memberCount=${memberCount}`;

    const imgPath = path.join(__dirname, "cache", `welcome_${newUserID}.jpg`);
    const res = await axios.get(apiURL, { responseType: "arraybuffer" });

    fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));

    const message = {
      body: `👋 Welcome to ${groupName}, ${username}!\nYou're member #${memberCount}.`,
      attachment: fs.createReadStream(imgPath),
    };

    api.sendMessage(message, threadID, () => fs.unlinkSync(imgPath));
  } catch (error) {
    console.error("Welcome event error:", error);
  }
};

module.exports.run = () => {};
