const axios = require('axios');
const { fetchWeatherApi } = await import('openmeteo');

module.exports.config = {
  name: 'weather',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['wthr', 'forecast'],
  description: "Get hourly weather forecast",
  usages: "weather [location]",
  credits: 'OpenMeteo + LorexAi',
  cooldowns: 0,
};

const locationMap = {
  manila: { latitude: 14.5995, longitude: 120.9842 },
  baguio: { latitude: 16.4023, longitude: 120.596 },
  cebu: { latitude: 10.3157, longitude: 123.8854 },
  davao: { latitude: 7.1907, longitude: 125.4553 },
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // Set location
  const locationInput = args[0]?.toLowerCase() || 'manila';
  const location = locationMap[locationInput] || locationMap['manila'];
  const locationName = capitalize(locationInput in locationMap ? locationInput : 'manila');

  // Send loading message
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`☁️ Fetching weather data for ${locationName}...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = "https://api.open-meteo.com/v1/forecast";
    const params = {
      ...location,
      hourly: [
        "temperature_2m",
        "relative_humidity_2m",
        "dew_point_2m",
        "precipitation",
        "apparent_temperature",
        "rain",
        "snow_depth",
        "precipitation_probability",
        "showers",
        "snowfall"
      ],
    };

    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];

    const hourly = response.hourly();
    const utcOffset = response.utcOffsetSeconds();
    const start = Number(hourly.time());
    const end = Number(hourly.timeEnd());
    const interval = hourly.interval();

    const time = [...Array((end - start) / interval)].map((_, i) =>
      new Date((start + i * interval + utcOffset) * 1000)
    );

    const weather = {
      time,
      temperature_2m: hourly.variables(0).valuesArray(),
      relative_humidity_2m: hourly.variables(1).valuesArray(),
      dew_point_2m: hourly.variables(2).valuesArray(),
      precipitation: hourly.variables(3).valuesArray(),
      apparent_temperature: hourly.variables(4).valuesArray(),
      rain: hourly.variables(5).valuesArray(),
      snow_depth: hourly.variables(6).valuesArray(),
      precipitation_probability: hourly.variables(7).valuesArray(),
      showers: hourly.variables(8).valuesArray(),
      snowfall: hourly.variables(9).valuesArray(),
    };

    let forecastText = `🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗳𝗼𝗿𝗲𝗰𝗮𝘀𝘁 𝗶𝗻 ${locationName}:\n`;

    for (let i = 0; i < 5; i++) {
      forecastText += `\n🕒 ${weather.time[i].toLocaleString()}`
        + `\n🌡️ Temp: ${weather.temperature_2m[i]}°C`
        + `\n💧 Humidity: ${weather.relative_humidity_2m[i]}%`
        + `\n🌧️ Rain: ${weather.rain[i]} mm`
        + `\n❄️ Snowfall: ${weather.snowfall[i]} cm\n`;
    }

    return api.editMessage(forecastText.trim(), loadingMsg.messageID, threadID);

  } catch (error) {
    console.error(error);
    return api.editMessage("❌ Error retrieving weather data. Try again later.", loadingMsg.messageID, threadID);
  }
};
