const axios = require('axios');

module.exports.config = {
  name: 'dalle',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['dmini', 'dall-mini'],
  description: "Generate an image using DALL‑E Mini API",
  usages: "dallemini [prompt]",
  credits: "You",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ').trim();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage("❌ Please enter a prompt to generate an image.", threadID, messageID);
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🎨 Generating image...", threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://daikyu-api.up.railway.app/api/dall-e-mini?query=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url);
    const data = response.data;

    // Assuming the API responds with something like { image: '<image_url>' }
    const imageUrl = data?.image || data?.url || null;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    await api.unsendMessage(loadingMsg.messageID);
    return api.sendMessage({ body: `Here’s your image for: "${prompt}"`, attachment: await getImageStream(imageUrl) }, threadID);

  } catch (err) {
    console.error("Error fetching image:", err.message);
    return api.editMessage("❌ Error generating image. Please try again later.", loadingMsg.messageID, threadID);
  }
};

// Helper to get image stream for FB messaging
async function getImageStream(url) {
  const res = await axios.get(url, { responseType: 'stream' });
  return res.data;
}
