const axios = require('axios');

module.exports.config = {
  name: 'earthquake1',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['quake', 'quakereport'],
  description: "Get recent earthquake data using Apiverve API",
  usages: "earthquake [location (optional)]",
  credits: 'Apiverve + LorexAi',
  cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const query = args.join(' ');

  const loading = await new Promise((resolve) => {
    api.sendMessage(`🌎 Fetching recent earthquake data${query ? ` for "${query}"` : ''}...`, threadID, (err, info) => resolve(info));
  });

  try {
    const response = await axios.get(`https://api.apiverve.com/v1/earthquake`, {
      headers: {
        'x-api-key': 'a29d203e-811c-4821-b6ae-7ca65bc6fd0c'
      }
    });

    const quakes = response.data.earthquakes;

    if (!quakes || quakes.length === 0) {
      return api.editMessage("❌ No recent earthquake data found.", loading.messageID, threadID);
    }

    // Optional filtering by query
    const filtered = query
      ? quakes.filter(q => q.place.toLowerCase().includes(query.toLowerCase()))
      : quakes;

    if (filtered.length === 0) {
      return api.editMessage(`❌ No earthquake data found for "${query}".`, loading.messageID, threadID);
    }

    let msg = `🌋 Recent Earthquakes${query ? ` near "${query}"` : ''}:\n`;

    filtered.slice(0, 5).forEach((quake, index) => {
      const date = new Date(quake.time).toLocaleString('en-US');
      msg += `\n${index + 1}. 🌐 ${quake.place}` +
             `\n📅 ${date}` +
             `\n📏 Magnitude: ${quake.mag}` +
             `\n🌍 Depth: ${quake.depth} km\n`;
    });

    return api.editMessage(msg, loading.messageID, threadID);
    
  } catch (err) {
    console.error(err);
    return api.editMessage("❌ Error retrieving earthquake data. Please try again later.", loading.messageID, threadID);
  }
};
