const axios = require("axios");

module.exports.config = {
  name: "eqrecent",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["earthquake", "quake", "eq"],
  description: "Get recent earthquake information with map.",
  usages: "eqrecent",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  try {
    // React 🚨 to indicate processing
    api.setMessageReaction("🚨", messageID, (err) => err && console.error(err));

    const { data } = await axios.get(
      "https://api.terraquakeapi.com/v1/earthquakes/recent?limit=5&page=1"
    );

    if (!data || !data.data || data.data.length === 0) {
      api.sendMessage("✅ Walang recent na lindol sa ngayon.", threadID, messageID);
      return;
    }

    let reply = "🌍 Recent Earthquakes:\n\n";
    for (let i = 0; i < data.data.length; i++) {
      const eq = data.data[i];
      const lat = eq.geometry.coordinates[1];
      const lng = eq.geometry.coordinates[0];
      const mapImage = eq.properties.map_url || eq.properties.image_url;

      reply += `${i + 1}. 📍 ${eq.properties.place}\n`;
      reply += `   🌡 Magnitude: ${eq.properties.mag}\n`;
      reply += `   🕒 Time: ${new Date(eq.properties.time).toLocaleString()}\n`;
      reply += `   📏 Depth: ${eq.geometry.coordinates[2]} km\n`;

      if (mapImage) {
        // Send message with map image
        api.sendMessage(
          {
            body: reply,
            attachment: await global.utils.getStreamFromURL(mapImage)
          },
          threadID
        );
      } else {
        // Send message without map image
        api.sendMessage(reply, threadID);
      }

      reply = ""; // Reset reply so next quake info is separate
    }

    api.setMessageReaction("", messageID, (err) => err && console.error(err));

  } catch (error) {
    console.error(error);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to fetch recent earthquakes.", threadID, messageID);
  }
};
