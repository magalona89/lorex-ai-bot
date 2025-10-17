const axios = require("axios");

module.exports.config = {
  name: "faceswap",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["swapface"],
  description: "Swap faces between two images.",
  usages: "faceswap [baseImageUrl] [swapImageUrl]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (args.length < 2) {
    return api.sendMessage("❌ Please provide two image URLs: base and swap.", threadID, messageID);
  }

  const baseUrl = args[0];
  const swapUrl = args[1];

  try {
    // React 🔄 to indicate processing
    api.setMessageReaction("🔄", messageID, (err) => err && console.error(err));

    // Request face swap API
    const response = await axios.get("https://urangkapolka.vercel.app/api/faceswap", {
      params: { baseUrl, swapUrl },
      responseType: "arraybuffer"
    });

    // Convert response to Buffer
    const imageBuffer = Buffer.from(response.data, "binary");

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Send swapped face image
    api.sendMessage({ body: "🤖 Face swapped!", attachment: imageBuffer }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to perform face swap. Make sure the image URLs are valid.", threadID, messageID);
  }
};
