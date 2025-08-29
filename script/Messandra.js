const axios = require("axios");

const config = {
  name: "meta",
  aliases: ["metai"],
  description: "Interact with Meta AI",
  usage: "<query>",
  cooldown: 0,
  permissions: [0],
  credits: "Keijo"
};

async function onStart({ message, args, event }) {
  const query = args.join(" ");

  if (!query) {
    return message.reply(
      "🔷 I'm 𝗠𝗲𝘁𝗮 𝗔𝗜, your digital companion! I'm here to assist, inform, and chat. What can I help you with today?"
    );
  }

  try {
    const response = await axios.get(
      `https://jer-ai.gleeze.com/meta?senderid=${encodeURIComponent(event.senderID)}&message=${encodeURIComponent(query)}`
    );

    const metaReply = response.data?.response || "❌ Meta AI didn't respond. Please try again later.";
    return message.reply(metaReply);
  } catch (err) {
    console.error("Meta AI Error:", err);
    return message.reply("⚠️ Error interacting with Meta AI. Try again later.");
  }
}

module.exports = {
  config,
  onStart
};
