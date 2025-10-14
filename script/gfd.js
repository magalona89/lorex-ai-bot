const axios = require('axios');

module.exports.config = {
  name: 'nasa',
  version: '1.0.1',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['earthpic', 'nasaepic'],
  description: "Get NASA EPIC Earth images by date (auto send images)",
  usages: "epic [YYYY-MM-DD]",
  credits: 'NASA EPIC + LorexAi',
  cooldowns: 0,
};

function formatDate(d) {
  const dateObj = new Date(d);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  let dateInput = args[0];

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
      "❌ Invalid date format. Please use YYYY-MM-DD.",
      threadID,
      messageID
    );
  }

  const loadingMsg = await new Promise((resolve) => {
    api.sendMessage(`🌍 Fetching NASA EPIC images for ${dateInput}...`, threadID, (err, info) =>
      resolve(info)
    );
  });

  try {
    const url = `https://epic.gsfc.nasa.gov/api/natural/date/${dateInput}`;
    const res = await axios.get(url);
    const images = res.data;

    if (!images || images.length === 0) {
      return api.editMessage(
        `❌ No EPIC images found for ${dateInput}.`,
        loadingMsg.messageID,
        threadID
      );
    }

    // Auto send each image with caption
    for (const item of images) {
      const imageName = item.image + '.jpg'; // Use JPG for smaller size & better compatibility
      const year = dateInput.split('-')[0];
      const month = dateInput.split('-')[1];
      const day = dateInput.split('-')[2];

      // Direct image URL from NASA EPIC archive (jpg version)
      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${imageName}`;

      // Caption with metadata
      const caption = `🌍 NASA EPIC Image\n📸 Name: ${item.image}\n🗓 Date Taken: ${item.date}\n📝 Caption: ${item.caption}\n📍 Lat: ${item.centroid_coordinates.lat}, Lon: ${item.centroid_coordinates.lon}`;

      // Send image with caption
      await api.sendMessage(
        {
          body: caption,
          attachment: await global.utils.getStreamFromURL(imageUrl), // Assuming your bot framework supports stream attachments
        },
        threadID
      );
    }

    // Remove loading message
    await api.unsendMessage(loadingMsg.messageID);
  } catch (error) {
    console.error(error);
    return api.editMessage(
      "❌ Error retrieving NASA EPIC data. Please try again later.",
      loadingMsg.messageID,
      threadID
    );
  }
};
