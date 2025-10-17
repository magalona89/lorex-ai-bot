const axios = require("axios");

module.exports.config = {
  name: "wt",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["wthr2", "forecast2"],
  description: "Get weather info from Urangkapolka API.",
  usages: "weather2 [location]",
  credits: "Vern",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const location = args.join(" ").trim() || "Bicol Region";

  try {
    // React 🌤️ to indicate processing
    api.setMessageReaction("🌤️", messageID, (err) => err && console.error(err));

    const { data } = await axios.get("https://urangkapolka.vercel.app/api/weather", {
      params: { q: location }
    });

    if (!data || !data.current) {
      api.sendMessage("❌ Failed to fetch weather data.", threadID, messageID);
      return;
    }

    const current = data.current;
    const forecast = data.forecast.slice(0, 5); // next 5 days

    let reply = `🌤 Weather for ${current.observationpoint}\n`;
    reply += `📅 Date: ${current.date}\n`;
    reply += `🌡 Temperature: ${current.temperature}°C (Feels like: ${current.feelslike}°C)\n`;
    reply += `🌥 Condition: ${current.skytext}\n`;
    reply += `💧 Humidity: ${current.humidity}%\n`;
    reply += `💨 Wind: ${current.winddisplay}\n\n`;

    reply += `📊 5-Day Forecast:\n`;
    forecast.forEach(day => {
      reply += `${day.day} (${day.date}): ${day.skytextday}, Low: ${day.low}°C, High: ${day.high}°C, Precip: ${day.precip}%\n`;
    });

    reply += `\n💡 POWERED BY GPT-5`;

    // Send weather image with text
    api.sendMessage(
      { body: reply, attachment: await global.utils.getStreamFromURL(current.imageUrl) },
      threadID,
      messageID
    );

    // Remove reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

  } catch (err) {
    console.error(err);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Error fetching weather info.", threadID, messageID);
  }
};
