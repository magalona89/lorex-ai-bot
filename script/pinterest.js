const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'pinterest',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['pin', 'pins'],
  description: "Search and send Pinterest images",
  usages: "pinterest [keyword]",
  credits: 'LorexAi',
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();

  if (!query) {
    return api.sendMessage("❌ Please provide a search keyword", threadID, messageID);
  }

  try {
    api.sendMessage(`🔎 Searching Pinterest...`, threadID, async (err, info) => {
      if (err) return;

      const res = await axios.get(`https://daikyu-api.up.railway.app/api/pinterest-img?search=${encodeURIComponent(query)}`);
      const results = res.data.results;

      if (!Array.isArray(results) || results.length === 0) {
        return api.sendMessage("❌ No images found.", threadID, () => {
          api.unsendMessage(info.messageID);
        });
      }

      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);

      const attachments = [];

      for (let i = 0; i < results.length; i++) {
        const url = results[i];
        const filename = `pin_${Date.now()}_${i}.jpg`;
        const filepath = path.join(cacheDir, filename);

        const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(filepath, Buffer.from(imgRes.data, 'binary'));
        attachments.push(fs.createReadStream(filepath));
      }

      api.sendMessage({ attachment: attachments }, threadID, async () => {
        for (const file of attachments) {
          fs.unlink(file.path);
        }
        api.unsendMessage(info.messageID); // 🧹 remove "Searching Pinterest..." after response
      });
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error fetching Pinterest images.", threadID, messageID);
  }
};
