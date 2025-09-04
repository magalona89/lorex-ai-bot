const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: 'geminu',
  version: '1.0.4',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Generate an image using gemini AI",
  usages: "Gemini [prompt]",
  credits: 'openai',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt.\nExample: Gemini butterfly", threadID, messageID);
  }

  try {
    const time = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${time}_flux.png`;
    const filePath = path.join(__dirname, 'cache', fileName);

    api.sendMessage(`🔄 Generating image...`, threadID, async (err, info) => {
      if (err) return;

      try {
        const response = await axios.get(`https://daikyu-api.up.railway.app/api/flux-img?prompt=${encodeURIComponent(prompt)}`, {
          responseType: "arraybuffer"
        });

        fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

        api.sendMessage({
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlinkSync(filePath);
          api.unsendMessage(info.messageID);
        });

      } catch (error) {
        console.error(error);
        api.sendMessage("❌ Failed to generate image. Try again later.", threadID, messageID);
        api.unsendMessage(info.messageID);
      }
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Unexpected error occurred.", threadID, messageID);
  }
};
