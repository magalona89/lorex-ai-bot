const axios = require('axios');

module.exports.config = {
  name: 'humanize',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['hm', 'rewrite'],
  description: "Rewrite text to sound more human/natural",
  usages: "humanize [text]",
  credits: 'LorexAi',
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const input = args.join(" ").trim();

  if (!input) {
    return api.sendMessage("❌ Please enter text to humanize.\n\nExample:\nhumanize Atoms are the smallest unit of matter...", threadID, messageID);
  }

  try {
    const msg = await new Promise(resolve => {
      api.sendMessage("🧠 Humanizing...", threadID, (err, info) => resolve(info));
    });

    const { data } = await axios.get("https://daikyu-api.up.railway.app/api/humanizer", {
      params: {
        text: input
      }
    });

    if (!data?.result) {
      return api.editMessage("❌ No response from the Humanizer API.", msg.messageID, threadID);
    }

    return api.editMessage(`✨ 𝗛𝘂𝗺𝗮𝗻𝗶𝘇𝗲𝗱 𝗧𝗲𝘅𝘁:\n\n${data.result}`, msg.messageID, threadID);
  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Failed to process the text. Try again later.", threadID, messageID);
  }
};
