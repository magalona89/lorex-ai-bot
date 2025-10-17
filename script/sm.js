const axios = require("axios");

module.exports.config = {
  name: "sms",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["sendsms"],
  description: "Send SMS using Urangkapolka API.",
  usages: "sms [number] [message]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const number = args[0];
  const smsMessage = args.slice(1).join(" ").trim();

  if (!number || !smsMessage) {
    return api.sendMessage("❌ Please provide a number and a message.\nUsage: sms [number] [message]", threadID, messageID);
  }

  try {
    // React ✉️ while processing
    api.setMessageReaction("✉️", messageID, (err) => err && console.error(err));

    const { data } = await axios.get("https://urangkapolka.vercel.app/api/sms", {
      params: { number, message: smsMessage }
    });

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    const reply = data.status
      ? `✅ SMS sent successfully to ${number}!\n💡 POWERED BY GPT-5`
      : `❌ Failed to send SMS.`;

    api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Error sending SMS.", threadID, messageID);
  }
};
