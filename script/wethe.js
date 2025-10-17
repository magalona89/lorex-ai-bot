const axios = require("axios");

module.exports.config = {
  name: "aiweather",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["weatherforecast", "wthr"],
  description: "Get weather forecast for any city with AQI and alerts.",
  usages: "weather [city]",
  credits: "YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

// Main function
module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const uid = event.senderID;

  let city = args.join(" ").trim() || "Manila"; // Default to Manila if no city provided

  try {
    // React 🚀 to indicate processing
    api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));

    const { data } = await axios.get(
      `https://api.weatherapi.com/v1/forecast.json?key=8d4c6ed946d54f4eb4360142251710&q=${encodeURIComponent(city)}&days=1&aqi=yes&alerts=yes`
    );

    const current = data.current;
    const forecast = data.forecast.forecastday[0].day;
    const alerts = data.alerts.alert || [];

    let reply = `🌤 Weather Forecast for ${data.location.name}, ${data.location.country}\n`;
    reply += `📅 Date: ${data.forecast.forecastday[0].date}\n`;
    reply += `🌡 Current Temp: ${current.temp_c}°C\n`;
    reply += `🌥 Condition: ${current.condition.text}\n`;
    reply += `🌡 Max Temp: ${forecast.maxtemp_c}°C\n`;
    reply += `🌡 Min Temp: ${forecast.mintemp_c}°C\n`;
    reply += `☔ Chance of Rain: ${forecast.daily_chance_of_rain}%\n`;
    reply += `💨 Wind: ${current.wind_kph} kph\n`;
    reply += `🌬 Air Quality (CO): ${current.air_quality.co.toFixed(2)}\n`;

    if (alerts.length > 0) {
      reply += `⚠️ Weather Alerts:\n`;
      alerts.forEach((alert, i) => {
        reply += `${i + 1}. ${alert.headline} - ${alert.desc}\n`;
      });
    } else {
      reply += `✅ No weather alerts today.`;
    }

    // Remove 🚀 reaction
    api.setMessageReaction("", messageID, (err) => err && console.error(err));

    // Send reply
    api.sendMessage(reply, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("", messageID, (err) => err && console.error(err));
    api.sendMessage("❌ Failed to fetch weather. Make sure the city name is correct.", threadID, messageID);
  }
};
