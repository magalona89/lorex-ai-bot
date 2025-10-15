const axios = require("axios");

module.exports.config = {
  name: "weather",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["agroweather", "agroweather", "aw"],
  description: "Get weather data from AgroMonitoring API.",
  usages: "weather <latitude> <longitude>\nExample: weather 14.1234 121.5678",
  credits: "Created by YourName",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 2) {
    return api.sendMessage(
      "🌤️ Please provide latitude and longitude.\nUsage: weather <latitude> <longitude>\nExample: weather 14.1234 121.5678",
      event.threadID,
      event.messageID
    );
  }

  const lat = args[0];
  const lon = args[1];
  const apiKey = process.env.AGROMONITORING_API_KEY;  
  if (!apiKey) {
    return api.sendMessage(
      "⚠️ API key for AgroMonitoring not configured.",
      event.threadID,
      event.messageID
    );
  }

  const url = `https://api.agromonitoring.com/agro/1.0/weather?lat=${lat}&lon=${lon}&APPID=${apiKey}`;

  api.sendMessage("⏳ Fetching weather data...", event.threadID, event.messageID);

  try {
    const res = await axios.get(url);
    const data = res.data;

    // check for error in response
    if (data.message) {
      // AgroMonitoring or OpenWeather style error
      return api.sendMessage(`⚠️ Error: ${data.message}`, event.threadID, event.messageID);
    }

    // Now build a message from data. The structure depends on what the API returns.
    // From docs (or sample) it might include temperature, humidity, etc.
    const { main, wind, clouds, time } = data;  // adjust field names per actual response
    // Example: data.main.temp, data.main.humidity, etc.

    let message = `🌿 **AgroWeather Data**\n\n`;
    message += `📍 Location: ${lat}, ${lon}\n`;
    if (main) {
      message += `🌡️ Temperature: ${main.temp} K\n`; // or convert to °C
      message += `💧 Humidity: ${main.humidity}%\n`;
      if (main.pressure) message += `🔻 Pressure: ${main.pressure} hPa\n`;
    }
    if (wind) {
      message += `🌬️ Wind Speed: ${wind.speed} m/s\n`;
      if (wind.deg !== undefined) message += `🧭 Wind Direction: ${wind.deg}°\n`;
    }
    if (clouds && clouds.all !== undefined) {
      message += `☁️ Cloudiness: ${clouds.all}%\n`;
    }
    if (time) {
      // convert timestamp to human readable
      const dt = new Date(time * 1000);
      message += `⏰ Time: ${dt.toUTCString()}\n`;
    }

    api.sendMessage(message, event.threadID, event.messageID);
  } catch (error) {
    console.error("AgroMonitoring API error:", error.response ? error.response.data : error.message);
    api.sendMessage(
      "❌ Unable to fetch weather data. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
