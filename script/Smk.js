const axios = require("axios");

module.exports.config = {
  name: "sim",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["simsimi", "chat"],
  description: "Chat with SimSimi.",
  usages: "sim [message]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const message = args.join(" ").trim();
  if (!message) return api.sendMessage("❌ Please provide a message.", threadID, messageID);

  try {
    const { data } = await axios.get("https://urangkapolka.vercel.app/api/simsimi", {
      params: { query: message }
    });

    api.sendMessage(data.result || "🤖 No response.", threadID, messageID);
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Failed to get response from SimSimi.", threadID, messageID);
  }
};
