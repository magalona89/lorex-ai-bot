const axios = require('axios');

const API_KEY = 'oxhuJn6fN9DgMnxNSO0dYOzEeLdvQH0SfFApRPGW';

module.exports.config = {
  name: 'marsweather',
  version: '1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['marsweather', 'marsweatherapi'],
  description: 'Gets latest Mars weather data from NASA InSight',
  usages: 'marsweather',
  cooldowns: 0,
};

function kelvinToCelsius(kelvin) {
  return (kelvin - 273.15).toFixed(1);
}

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage('🚀 Fetching latest Mars weather data...', threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://api.nasa.gov/insight_weather/?api_key=${API_KEY}&feedtype=json&ver=1.0`;
    const res = await axios.get(url);
    const data = res.data;

    if (!data || !data.sol_keys || data.sol_keys.length === 0) {
      return api.editMessage('❌ No Mars weather data available right now.', loadingMsg.messageID, threadID);
    }

    const latestSol = data.sol_keys[data.sol_keys.length - 1];
    const solData = data[latestSol];

    // Convert temperatures from Kelvin to Celsius (if needed)
    const avgTemp = solData?.AT?.av ? solData.AT.av.toFixed(1) : 'N/A';
    const minTemp = solData?.AT?.mn ? solData.AT.mn.toFixed(1) : 'N/A';
    const maxTemp = solData?.AT?.mx ? solData.AT.mx.toFixed(1) : 'N/A';

    const windSpeed = solData?.HWS?.av ? solData.HWS.av.toFixed(2) : 'N/A';
    const windDirection = solData?.WD?.most_common?.compass_point || 'N/A';
    const pressure = solData?.PRE?.av ? solData.PRE.av.toFixed(2) : 'N/A';

    const season = solData.Season || 'N/A';

    const output = `🪐 Mars Weather Report (Sol ${latestSol})
🌡️ Temperature: Avg ${avgTemp} °C | Min ${minTemp} °C | Max ${maxTemp} °C
🌬️ Wind: Avg Speed ${windSpeed} m/s | Direction ${windDirection}
📈 Pressure: Avg ${pressure} Pa
🌱 Season: ${capitalizeFirstLetter(season)}
`;

    api.editMessage(output, loadingMsg.messageID, threadID);
  } catch (error) {
    console.error(error);
    api.editMessage('❌ Error fetching Mars weather data. Please try again later.', loadingMsg.messageID, threadID);
  }
};

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
