const fs = require("fs");
const axios = require("axios");
const path = require("path");

const autopostFile = path.join(__dirname, "epic_autopost.json");

module.exports.config = {
  name: "Nasaa",
  version: "1.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["epic", "postepic"],
  description: "Fetch NASA EPIC images and post automatically or manually with toggle",
  usages: "epicpost [date YYYY-MM-DD] | epicpost auto on/off",
  cooldowns: 0,
};

// Save/load autopost config (enabled + threadID)
function saveAutoConfig(config) {
  fs.writeFileSync(autopostFile, JSON.stringify(config, null, 2));
}
function loadAutoConfig() {
  try {
    return JSON.parse(fs.readFileSync(autopostFile));
  } catch {
    return { enabled: false, threadID: "" };
  }
}

function formatDate(d) {
  const dateObj = new Date(d);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fetch latest date from NASA EPIC API
async function fetchLatestDate() {
  try {
    const res = await axios.get("https://epic.gsfc.nasa.gov/api/natural");
    if (res.data && res.data.length > 0) {
      return res.data[0].date.split(" ")[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Download images from EPIC and return file streams
async function downloadEpicImages(images, tempDir) {
  const files = [];

  // Limit number of images to 3 for posting to avoid spamming
  const limitImages = images.slice(0, 3);

  for (const img of limitImages) {
    // Image URL format (natural color):
    // https://epic.gsfc.nasa.gov/archive/natural/YYYY/MM/DD/png/imagename.png
    const dateParts = img.date.split(" ")[0].split("-");
    const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}/png/${img.image}.png`;

    const filename = `${Date.now()}_${img.image}.png`;
    const filePath = path.join(tempDir, filename);

    const response = await axios({
      url: imgUrl,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    files.push(fs.createReadStream(filePath));
  }

  return files;
}

// Compose the post message from images metadata
function composePostMessage(date, images) {
  let output = `🌍 𝗡𝗔𝗦𝗔 𝗘𝗣𝗜𝗖 𝗜𝗺𝗮𝗴𝗲𝘀 𝗳𝗼𝗿 ${formatDate(date)}:\n`;

  images.slice(0, 3).forEach((img, idx) => {
    output +=
      `\n📸 Image #${idx + 1}: ${img.image}.png` +
      `\n🗓 Date Taken: ${img.date}` +
      `\n📝 Caption: ${img.caption}` +
      `\n📍 Coordinates: Lat ${img.centroid_coordinates.lat}, Lon ${img.centroid_coordinates.lon}\n`;
  });

  return output;
}

// Autopost scheduler flag so we don't schedule multiple times
let isScheduled = false;

// Autopost function every 24 hours
function scheduleAutoPost(api) {
  if (isScheduled) return;
  isScheduled = true;

  setInterval(async () => {
    const config = loadAutoConfig();
    if (!config.enabled || !config.threadID) return;

    const threadID = config.threadID;

    const tempDir = path.join(__dirname, "cache");
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      const date = await fetchLatestDate();
      if (!date) return;

      const url = `https://epic.gsfc.nasa.gov/api/natural/date/${date}`;
      const res = await axios.get(url);
      const images = res.data;
      if (!images || images.length === 0) return;

      // Download images
      const files = await downloadEpicImages(images, tempDir);
      const message = composePostMessage(date, images);

      // Create post data for api.createPost
      const postData = { body: message };
      postData.attachment = files.length === 1 ? files[0] : files;

      try {
        const postUrl = await api.createPost(postData);

        api.sendMessage(
          `✅ Auto-posted NASA EPIC images!\n🔗 ${postUrl || "No URL returned."}`,
          threadID
        );
      } catch (err) {
        console.error("❌ Auto post error:", err);
      }

      // Clean up files
      files.forEach((fileStream) => {
        if (fileStream.path) {
          fs.unlink(fileStream.path, (e) => {
            if (e) console.error("❌ Error deleting file:", e);
          });
        }
      });
    } catch (err) {
      console.error("❌ Auto-post general error:", err);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours interval
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const subcmd = args[0]?.toLowerCase();

  // Toggle autopost ON/OFF commands
  if (subcmd === "auto" && args[1]) {
    const action = args[1].toLowerCase();
    const config = loadAutoConfig();

    if (action === "on") {
      config.enabled = true;
      config.threadID = threadID;
      saveAutoConfig(config);
      scheduleAutoPost(api);

      return api.sendMessage(
        "✅ NASA EPIC autopost enabled. Images will be posted daily in this chat.",
        threadID,
        messageID
      );
    } else if (action === "off") {
      config.enabled = false;
      saveAutoConfig(config);

      return api.sendMessage(
        "❌ NASA EPIC autopost disabled.",
        threadID,
        messageID
      );
    } else {
      return api.sendMessage(
        "❓ Usage: epicpost auto on | epicpost auto off",
        threadID,
        messageID
      );
    }
  }

  // Manual fetch & post for a specific date or latest if no date provided
  let dateInput = args[0];

  if (!dateInput || dateInput === "auto") {
    dateInput = await fetchLatestDate();
    if (!dateInput) {
      return api.sendMessage(
        "❌ Failed to get latest NASA EPIC date. Please provide a date (YYYY-MM-DD).",
        threadID,
        messageID
      );
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return api.sendMessage(
      "❌ Invalid date format. Use YYYY-MM-DD.",
      threadID,
      messageID
    );
  }

  // Start processing: get images metadata
  const loadingMsg = await new Promise((resolve) => {
    api.sendMessage(
      `🌍 Fetching NASA EPIC images for ${dateInput}...`,
      threadID,
      (err, info) => resolve(info)
    );
  });

  const tempDir = path.join(__dirname, "cache");
  fs.mkdirSync(tempDir, { recursive: true });

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

    // Download images to post
    const files = await downloadEpicImages(images, tempDir);
    const message = composePostMessage(dateInput, images);

    // Prepare post data with attachments
    const postData = { body: message };
    postData.attachment = files.length === 1 ? files[0] : files;

    // Create the post on Facebook
    try {
      const postUrl = await api.createPost(postData);

      await api.editMessage(
        `✅ Post created successfully!\n🔗 ${postUrl || "No URL returned."}`,
        loadingMsg.messageID,
        threadID
      );
    } catch (error) {
      let errorMessage = "❌ An unknown error occurred.";

      if (error?.errors?.length > 0) {
        errorMessage = error.errors.map((e) => e.message).join("\n");
      } else if (error.message) {
        errorMessage = error.message;
      }

      await api.editMessage(
        `❌ Error creating post:\n${errorMessage}`,
        loadingMsg.messageID,
        threadID
      );
    }

    // Cleanup downloaded files
    files.forEach((fileStream) => {
      if (fileStream.path) {
        fs.unlink(fileStream.path, (err) => {
          if (err) console.error("❌ Error deleting file:", err);
        });
      }
    });
  } catch (err) {
    console.error("❌ Error fetching NASA EPIC data:", err);
    await api.editMessage(
      "❌ Error retrieving NASA EPIC data. Please try again later.",
      loadingMsg.messageID,
      threadID
    );
  }
};

// Schedule autopost on bot startup if enabled
module.exports.load = function ({ api }) {
  const config = loadAutoConfig();
  if (config.enabled && config.threadID) {
    scheduleAutoPost(api);
  }
};
