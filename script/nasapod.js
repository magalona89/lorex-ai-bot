const axios = require('axios');

const API_KEY = 'oxhuJn6fN9DgMnxNSO0dYOzEeLdvQH0SfFApRPGW';

module.exports.config = {
  name: 'apod',
  version: '1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['nasaapod', 'astronomypic'],
  description: 'Gets NASA Astronomy Picture of the Day',
  usages: 'apod [YYYY-MM-DD]',
  cooldowns: 0,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  let date = args[0]; // optional date input

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return api.sendMessage('❌ Invalid date format! Use YYYY-MM-DD.', threadID, messageID);
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage('🌌 Fetching NASA Astronomy Picture of the Day...', threadID, (err, info) => resolve(info));
  });

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}` + (date ? `&date=${date}` : '');
    const res = await axios.get(url);
    const data = res.data;

    let message = `🌌 NASA Astronomy Picture of the Day${date ? ` (${date})` : ''}:\n\n`;
    message += `📅 Date: ${data.date}\n`;
    message += `📝 Title: ${data.title}\n\n`;
    message += `${data.explanation}\n\n`;

    if (data.media_type === 'image') {
      api.editMessage({ body: message, attachment: (await axios.get(data.url, { responseType: 'arraybuffer' })).data }, loadingMsg.messageID, threadID);
    } else if (data.media_type === 'video') {
      message += `🎥 Video URL: ${data.url}`;
      api.editMessage(message, loadingMsg.messageID, threadID);
    } else {
      api.editMessage(message, loadingMsg.messageID, threadID);
    }
  } catch (error) {
    console.error(error);
    api.editMessage('❌ Error fetching APOD. Please try again later.', loadingMsg.messageID, threadID);
  }
};
