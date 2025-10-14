const axios = require('axios');
const { createReadStream } = require('fs');
const { get } = require('https');
const { tmpdir } = require('os');
const { join } = require('path');
const { writeFileSync } = require('fs');

module.exports.config = {
  name: 'nas',
  version: '1.0.3',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['earthpic', 'nasaepic'],
  description: "Auto-send NASA EPIC Earth images with photo attachments",
  usages: "epic [YYYY-MM-DD]",
  credits: 'NASA EPIC + LorexAi',
  cooldowns: 0,
};

// Helper: Format date to readable text
function formatDateText(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Helper: Download image stream from URL
global.utils = global.utils || {};
global.utils.getStreamFromURL = async function (url) {
  const filePath = join(tmpdir(), Date.now() + '.jpg');
  const writer = writeFileSync;

  return new Promise((resolve, reject) => {
    get(url, (res) => {
      const data = [];

      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        writer(filePath, Buffer.concat(data));
        resolve(createReadStream(filePath));
      });
    }).on('error', reject);
  });
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let dateInput = args[0];

  // If no date, get latest date
  async function fetchLatestDate() {
    try {
      const res = await axios.get('https://epic.gsfc.nasa.gov/api/natural');
      if (res.data && res.data.length > 0) {
        return res.data[0].date.split(' ')[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  if (!dateInput) {
    dateInput = await fetchLatestDate();
    if (!dateInput) {
      return api.sendMessage(
        "❌ Failed to get latest EPIC date. Please provide a date (YYYY-MM-DD).",
        threadID,
        messageID
      );
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return api.sendMessage(
      "❌ Invalid date format. Use `epic 2023-10-10`.",
      threadID,
      messageID
    );
  }

  // Loading message
  const loadingMsg = await new Promise((resolve) => {
    api.sendMessage(`📡 Fetching NASA EPIC images for ${dateInput}...`, threadID, (err, info) =>
      resolve(info)
    );
  });

  try {
    const url = `https://epic.gsfc.nasa.gov/api/natural/date/${dateInput}`;
    const res = await axios.get(url);
    const images = res.data;

    if (!images || images.length === 0) {
      return api.editMessage(
        `❌ No EPIC images found on ${dateInput}.`,
        loadingMsg.messageID,
        threadID
      );
    }

    const [year, month, day] = dateInput.split('-');

    for (const item of images) {
      const imageName = item.image + '.jpg';
      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${imageName}`;

      const caption =
`🌍 𝗘𝗮𝗿𝘁𝗵 𝗙𝗿𝗼𝗺 𝗡𝗔𝗦𝗔 𝗘𝗣𝗜𝗖
📸 𝗜𝗺𝗮𝗴𝗲: ${item.image}
🗓 𝗗𝗮𝘁𝗲: ${formatDateText(item.date)}
📝 ${item.caption}
📍 Lat: ${item.centroid_coordinates.lat}°, Lon: ${item.centroid_coordinates.lon}°`;

      await api.sendMessage(
        {
          body: caption,
          attachment: await global.utils.getStreamFromURL(imageUrl),
        },
        threadID
      );
    }

    await api.unsendMessage(loadingMsg.messageID);
  } catch (error) {
    console.error('❌ Error:', error.message || error);
    return api.editMessage(
      "❌ Error retrieving or sending EPIC data. Please try again later.",
      loadingMsg.messageID,
      threadID
    );
  }
};
