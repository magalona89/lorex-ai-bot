const axios = require("axios");

module.exports.config = {
  name: "up",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["botup", "status"],
  description: "Show bot uptime and social links.",
  usages: "uptime [botname] [insta] [github] [fb]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const botname = args[0] || "MyBot";
  const instag = args[1] || "";
  const ghub = args[2] || "";
  const fb = args[3] || "";

  try {
    // React ⏱️ to indicate processing
    api.setMessageReaction("⏱️", messageID, (err) => err && console.error(err));

    // Call uptime API
    const response = await axios.get("https://urangkapolka.vercel.app/api/uptime", {
      params: {
        instag,
        ghub,
        fb,
        hours: 0,
        minutes: 0,
        seconds: 0,
        botname
      }
    });

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Send uptime message
    const reply = `💡 POWERED BY GPT-5\n\n${response.data.result || "✅ Uptime info not available."}`;
    api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to fetch uptime info.", threadID, messageID);
  }
};
