const axios = require('axios');

module.exports.config = {
  name: "ariavideo",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Maghanap ng TikTok video gamit ang keyword",
  usages: "tiktok [keyword]",
  credits: "Rynxzei | Modified by ChatGPT",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const query = args.join(" ").trim();

  if (!query) {
    return api.sendMessage("❗𝗠𝗮𝗴𝗹𝗮𝗴𝗮𝘆 𝗻𝗴 𝘀𝗲𝗮𝗿𝗰𝗵 𝗸𝗲𝘆𝘄𝗼𝗿𝗱. Example: `ariavideo funny cat`", threadID, messageID);
  }

  const loading = await new Promise(resolve => {
    api.sendMessage("⏳ 𝗦𝗲𝗮𝗿𝗰𝗵𝗶𝗻𝗴 𝗧𝗶𝗸𝗧𝗼𝗸...", threadID, (err, info) => resolve(info));
  });

  try {
    const res = await axios.get(`https://api-rynxzei.onrender.com/api/tiktok?query=${encodeURIComponent(query)}`);
    const data = res.data;

    if (!data || !data.result) {
      return api.editMessage("❌ Walang nahanap na resulta para sa iyong query.", loading.messageID, threadID);
    }

    const { result } = data;

    let msg = `🎯 𝗧𝗶𝗸𝗧𝗼𝗸 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁:\n`;
    if (result.title) msg += `📌 Title: ${result.title}\n`;
    if (result.author) msg += `👤 Author: ${result.author}\n`;
    if (result.url) msg += `🔗 Link: ${result.url}\n`;
    if (result.description) msg += `📝 Description: ${result.description}\n`;

    return api.editMessage(msg, loading.messageID, threadID);

  } catch (err) {
    console.error("❌ TikTok API Error:", err);
    return api.editMessage("⚠️ Nagkaroon ng error sa pagkuha ng TikTok data.", loading.messageID, threadID);
  }
};
