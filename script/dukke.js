const axios = require("axios");

module.exports.config = {
  name: "duck",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["ducky", "quack"],
  description: "Sends a random duck image or GIF from random-d.uk API",
  usages: "duck [random|gif|list|http <code>|id <num>]",
  credits: "Created by GPT-5",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const baseUrl = "https://random-d.uk/api/v2";
  const type = args[0] ? args[0].toLowerCase() : "random";
  const input = args[1];

  api.sendMessage("🦆 Quack... fetching your duck!", event.threadID, event.messageID);

  try {
    let endpoint = "";
    let response;

    switch (type) {
      case "random":
        endpoint = `${baseUrl}/random`;
        response = await axios.get(endpoint);
        break;

      case "gif":
        endpoint = `${baseUrl}/random?type=gif`;
        response = await axios.get(endpoint);
        break;

      case "jpg":
      case "image":
        endpoint = `${baseUrl}/random?type=jpg`;
        response = await axios.get(endpoint);
        break;

      case "quack":
        endpoint = `${baseUrl}/quack`;
        response = await axios.get(endpoint);
        break;

      case "list":
        endpoint = `${baseUrl}/list`;
        response = await axios.get(endpoint);
        const data = response.data;
        return api.sendMessage(
          `🦆 Duck List Info:\n` +
          `📸 Total Images: ${data.image_count}\n` +
          `🎞️ Total GIFs: ${data.gif_count}\n\n` +
          `💡 Example: duck id 23 or duck http 404`,
          event.threadID,
          event.messageID
        );

      case "id":
        if (!input) return api.sendMessage("⚠️ Please specify a duck ID. Example: duck id 23", event.threadID, event.messageID);
        endpoint = `${baseUrl}/${input}.jpg`;
        return api.sendMessage({ body: `🦆 Here's duck #${input}`, attachment: await global.utils.getStreamFromURL(endpoint) }, event.threadID, event.messageID);

      case "http":
        if (!input) return api.sendMessage("⚠️ Please provide an HTTP code. Example: duck http 404", event.threadID, event.messageID);
        endpoint = `${baseUrl}/http/${input}`;
        return api.sendMessage({ body: `🦆 HTTP ${input} duck!`, attachment: await global.utils.getStreamFromURL(endpoint) }, event.threadID, event.messageID);

      default:
        endpoint = `${baseUrl}/random`;
        response = await axios.get(endpoint);
    }

    // Display random duck
    const { url, message } = response.data;
    api.sendMessage(
      {
        body: `🦆 ${message || "Here’s your duck!"}`,
        attachment: await global.utils.getStreamFromURL(url)
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error("Duck API error:", err.message);
    api.sendMessage("❌ Oops! Couldn't fetch a duck right now. Try again later.", event.threadID, event.messageID);
  }
};
