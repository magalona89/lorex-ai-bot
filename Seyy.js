const axios = require('axios');

const adminUID = "61580959514473";

let isUnderMaintenance = false;

module.exports.config = {
  name: 'wt',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['singaporeweather', 'sgweather', 'weather'],
  description: "Get Singapore real-time weather info: UV, Rainfall, 24hr Forecast",
  usages: "singweather uv | singweather rainfall | singweather forecast | singweather maint [on/off]",
  credits: 'ChatGPT',
  cooldowns: 0
};

const endpoints = {
  uv: 'https://api-open.data.gov.sg/v2/real-time/api/uv',
  rainfall: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
  forecast: 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast'
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args[0]?.toLowerCase();

  // Maintenance toggle
  if (input === "maint") {
    if (uid !== adminUID) {
      return api.sendMessage("⛔ Only admin can toggle maintenance.", threadID, messageID);
    }
    const toggle = args[1]?.toLowerCase();
    if (toggle === "on") {
      isUnderMaintenance = true;
      return api.sendMessage("🔧 Maintenance mode ON.", threadID, messageID);
    } else if (toggle === "off") {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode OFF.", threadID, messageID);
    } else {
      return api.sendMessage("⚙️ Usage: `singweather maint on` or `singweather maint off`", threadID, messageID);
    }
  }

  if (isUnderMaintenance && uid !== adminUID) {
    return api.sendMessage("🚧 Weather API is under maintenance. Admin only.", threadID, messageID);
  }

  if (!input || !['uv', 'rainfall', 'forecast'].includes(input)) {
    return api.sendMessage("⚠️ Please specify what info to get:\n- uv\n- rainfall\n- forecast\nUsage: singweather [uv|rainfall|forecast]", threadID, messageID);
  }

  const loading = await new Promise(resolve => {
    api.sendMessage(`⏳ Fetching Singapore ${input} data...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = endpoints[input];
    const res = await axios.get(url);

    if (!res.data) {
      return api.editMessage("⚠️ No data received from API.", loading.messageID, threadID);
    }

    let message = `📊 Singapore ${input.toUpperCase()} Data:\n\n`;

    switch(input) {
      case 'uv':
        // Example parsing UV data from res.data.items
        if (res.data.items && res.data.items.length > 0) {
          const uvItem = res.data.items[0];
          if (uvItem.readings) {
            message += Object.entries(uvItem.readings)
              .map(([area, value]) => `🏙️ ${area.toUpperCase()}: UV Index ${value}`)
              .join('\n');
          } else {
            message += "No UV readings found.";
          }
        } else {
          message += "No UV data found.";
        }
        break;

      case 'rainfall':
        // Parsing rainfall data from res.data.items
        if (res.data.items && res.data.items.length > 0) {
          const rainItem = res.data.items[0];
          if (rainItem.readings) {
            message += Object.entries(rainItem.readings)
              .map(([area, value]) => `🌧️ ${area.toUpperCase()}: ${value} mm`)
              .join('\n');
          } else {
            message += "No rainfall readings found.";
          }
        } else {
          message += "No rainfall data found.";
        }
        break;

      case 'forecast':
        // Parsing 24-hr forecast text from res.data.items
        if (res.data.items && res.data.items.length > 0) {
          const forecastItem = res.data.items[0];
          if (forecastItem.general) {
            message += `📝 Forecast: ${forecastItem.general.forecast}`;
          } else {
            message += "No forecast information found.";
          }
        } else {
          message += "No forecast data found.";
        }
        break;
    }

    return api.editMessage(message.trim(), loading.messageID, threadID);

  } catch (error) {
    console.error("Weather API error:", error.message);
    return api.editMessage("❌ Failed to fetch weather data.", loading.messageID, threadID);
  }
};
