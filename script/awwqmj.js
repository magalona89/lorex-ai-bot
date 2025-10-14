const axios = require('axios');

module.exports.config = {
  name: 'for',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['forecast', 'weatherforecast'],
  description: "Get weather forecast for a city using Apiverve",
  usages: "weather [city]",
  credits: 'Apiverve + LorexAi',
  cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const city = args.join(' ');
  if (!city) {
    return api.sendMessage("❌ Please enter a city.\n\nExample: `weather Manila`", threadID, messageID);
  }

  const loading = await new Promise((resolve) => {
    api.sendMessage(`🌦 Fetching weather for "${city}"...`, threadID, (err, info) => resolve(info));
  });

  try {
    const response = await axios.get(`https://api.apiverve.com/v1/weatherforecast`, {
      params: { city },
      headers: {
        'x-api-key': 'a29d203e-811c-4821-b6ae-7ca65bc6fd0c'
      }
    });

    const data = response.data;

    if (!data || data.cod !== "200") {
      return api.editMessage(`❌ Couldn't find weather for "${city}".`, loading.messageID, threadID);
    }

    const current = data.list[0];
    const cityName = data.city.name;
    const country = data.city.country;
    const temp = current.main.temp;
    const feels = current.main.feels_like;
    const weather = current.weather[0].description;
    const humidity = current.main.humidity;
    const wind = current.wind.speed;

    const forecastMessage = 
`🌍 Weather in ${cityName}, ${country}:
☁️ Condition: ${weather}
🌡 Temperature: ${temp}°C
🥵 Feels Like: ${feels}°C
💧 Humidity: ${humidity}%
💨 Wind Speed: ${wind} m/s`;

    return api.editMessage(forecastMessage, loading.messageID, threadID);
  } catch (error) {
    console.error(error);
    return api.editMessage("❌ Error fetching weather data. Try again later.", loading.messageID, threadID);
  }
};
