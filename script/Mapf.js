const axios = require('axios');

module.exports.config = {
  name: 'map',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['wthr', 'forecast'],
  description: "Get current weather using WeatherAPI.com",
  usages: "weather [location]",
  credits: 'WeatherAPI + LorexAi',
  cooldowns: 0,
};

const API_KEY = '3ad589ad10024b1696561241251410'; // Your WeatherAPI key

function capitalizeWords(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!args[0]) {
    return api.sendMessage("📍 Please enter a location. Example: `map manila`", threadID, messageID);
  }

  const location = args.join(' ');
  const locationDisplay = capitalizeWords(location);

  // Send loading message
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`☁️ Fetching weather for ${locationDisplay}...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `http://api.weatherapi.com/v1/current.json`;
    const params = {
      key: API_KEY,
      q: location,
      aqi: 'no'
    };

    const res = await axios.get(url, { params });
    const data = res.data;

    const {
      temp_c,
      feelslike_c,
      humidity,
      wind_kph,
      is_day,
      condition
    } = data.current;

    const { name, country, localtime } = data.location;

    const weatherText = 
`🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗿𝗲𝗽𝗼𝗿𝘁 𝗳𝗼𝗿 ${name}, ${country}
🕒 Local Time: ${localtime}
📍 Condition: ${condition.text}
🌡️ Temperature: ${temp_c}°C (Feels like ${feelslike_c}°C)
💧 Humidity: ${humidity}%
💨 Wind: ${wind_kph} kph
🌓 Time: ${is_day ? 'Day ☀️' : 'Night 🌙'}`;

    return api.editMessage(weatherText, loadingMsg.messageID, threadID);

  } catch (error) {
    console.error("Weather API error:", error?.response?.data || error.message);

    const errorMsg = error.response?.data?.error?.message || "An error occurred while retrieving weather data.";
    return api.editMessage(`❌ Failed to fetch weather.\n🛑 ${errorMsg}`, loadingMsg.messageID, threadID);
  }
};
