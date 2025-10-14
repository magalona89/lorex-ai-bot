const axios = require('axios');

const API_KEY = 'oxhuJn6fN9DgMnxNSO0dYOzEeLdvQH0SfFApRPGW';

function validateDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

module.exports.config = {
  name: 'neo',
  version: '1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: 'NASA Near Earth Object feed data',
  usages: 'neo [start_date] [end_date]',
  cooldowns: 0,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  let startDate = args[0];
  let endDate = args[1];

  // Default: today and next 2 days
  const today = new Date().toISOString().split('T')[0];
  if (!startDate) startDate = today;
  if (!endDate) endDate = addDays(startDate, 2);

  if (!validateDate(startDate) || !validateDate(endDate)) {
    return api.sendMessage('❌ Invalid date format! Use YYYY-MM-DD.', threadID, messageID);
  }

  if (new Date(endDate) < new Date(startDate)) {
    return api.sendMessage('❌ end_date must be the same or after start_date.', threadID, messageID);
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`🚀 Fetching NASA NEO data from ${startDate} to ${endDate}...`, threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;

    if (!data.near_earth_objects) {
      return api.editMessage('❌ No Near Earth Objects data found.', loadingMsg.messageID, threadID);
    }

    let output = `🚀 NASA Near Earth Objects from ${formatDate(startDate)} to ${formatDate(endDate)}:\n`;

    const dates = Object.keys(data.near_earth_objects).sort();
    for (const date of dates) {
      const neos = data.near_earth_objects[date];
      output += `\n📅 ${formatDate(date)} — ${neos.length} objects detected\n`;
      neos.forEach((obj, i) => {
        output += `\n #${i + 1}: ${obj.name}\n` +
          ` - Potentially hazardous: ${obj.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}\n` +
          ` - Estimated diameter: ${obj.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)}km - ${obj.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)}km\n` +
          ` - Closest approach date/time: ${obj.close_approach_data[0].close_approach_date_full}\n` +
          ` - Miss distance (km): ${parseFloat(obj.close_approach_data[0].miss_distance.kilometers).toFixed(0)}\n` +
          ` - Relative velocity (km/h): ${parseFloat(obj.close_approach_data[0].relative_velocity.kilometers_per_hour).toFixed(0)}\n`;
      });
      output += '\n---\n';
    }

    if (output.length > 1900) {
      const chunks = output.match(/[\s\S]{1,1900}/g);
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          await api.editMessage(chunks[i], loadingMsg.messageID, threadID);
        } else {
          await api.sendMessage(chunks[i], threadID);
        }
      }
    } else {
      await api.editMessage(output, loadingMsg.messageID, threadID);
    }
  } catch (err) {
    console.error(err);
    await api.editMessage('❌ Error fetching NEO data. Please try again later.', loadingMsg.messageID, threadID);
  }
};
