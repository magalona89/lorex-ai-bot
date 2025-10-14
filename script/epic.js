const axios = require('axios');

module.exports.config = {
  name: 'epic',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['earthpic', 'nasaepic'],
  description: "Get NASA EPIC Earth images metadata by date",
  usages: "epic [YYYY-MM-DD]",
  credits: 'NASA EPIC + LorexAi',
  cooldowns: 0,
};

function capitalizeWords(str) {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(d) {
  const dateObj = new Date(d);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  let dateInput = args[0];

  // Helper: fetch latest date if no input
  async function fetchLatestDate() {
    try {
      const res = await axios.get('https://epic.gsfc.nasa.gov/api/natural');
      if (res.data && res.data.length > 0) {
        // Date format is YYYY-MM-DD HH:mm:ss, get date part only
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

  // Validate date format simple check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return api.sendMessage(
      "❌ Invalid date format. Please use YYYY-MM-DD.",
      threadID,
      messageID
    );
  }

  // Send loading message
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

    let output = `🌍 𝗡𝗔𝗦𝗔 𝗘𝗣𝗜𝗖 𝗜𝗺𝗮𝗴𝗲𝘀 𝗳𝗼𝗿 ${formatDate(dateInput)}:\n`;

    images.forEach((img, idx) => {
      output +=
        `\n📸 Image #${idx + 1}: ${img.image}.png` +
        `\n🗓 Date Taken: ${img.date}` +
        `\n📝 Caption: ${img.caption}` +
        `\n📍 Coordinates: Lat ${img.centroid_coordinates.lat}, Lon ${img.centroid_coordinates.lon}\n`;
    });

    if (output.length > 1900) {
      // Split message if too long (Facebook Messenger / others limit ~2000 chars)
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
  } catch (error) {
    console.error(error);
    return api.editMessage(
      "❌ Error retrieving NASA EPIC data. Please try again later.",
      loadingMsg.messageID,
      threadID
    );
  }
};
