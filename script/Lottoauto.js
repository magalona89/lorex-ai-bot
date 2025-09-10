const axios = require("axios");
const cron = require("node-cron");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "lottoauto",
  version: "1.2",
  hasPermission: 2,
  usePrefix: true,
  aliases: [],
  description: "Auto-post Lotto & Bingo Plus results every 3 minutes (ON/OFF)",
  usages: "[on/off]",
  cooldowns: 0,
};

let intervalTask = null;
const imageURL = "https://i.imgur.com/Bkb0kDB.jpeg";
const imagePath = path.join(__dirname, "cache", "lotto_banner.jpeg");

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const command = args[0]?.toLowerCase();

  if (!["on", "off"].includes(command)) {
    return api.sendMessage(
      "📌 Usage:\n/lottoauto on - Start auto-posting\n/lottoauto off - Stop auto-posting",
      threadID,
      messageID
    );
  }

  if (command === "on") {
    if (intervalTask) {
      return api.sendMessage("⚠️ Auto-posting is already running.", threadID, messageID);
    }

    // Ensure image is downloaded
    await downloadImageIfNeeded(imageURL, imagePath);

    api.sendMessage("✅ Auto-posting started! Results will be posted every 3 minutes.", threadID, messageID);

    intervalTask = cron.schedule("*/3 * * * *", async () => {
      try {
        const lottoData = await getLottoResults();
        const bingoData = await getBingoPlusResults();

        const message = {
          body: `🎯 𝗟𝗔𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n\n📌 𝗟𝗢𝗧𝗧𝗢:\n${lottoData}\n\n🎲 𝗕𝗜𝗡𝗚𝗢 𝗣𝗟𝗨𝗦:\n${bingoData}`,
          attachment: fs.createReadStream(imagePath),
        };

        api.sendMessage(message, threadID);
      } catch (err) {
        console.error("❌ Error auto-posting:", err);
        api.sendMessage("❌ Failed to fetch Lotto/Bingo results.", threadID);
      }
    });

  } else if (command === "off") {
    if (!intervalTask) {
      return api.sendMessage("⚠️ Auto-posting is not running.", threadID, messageID);
    }

    intervalTask.stop();
    intervalTask = null;
    return api.sendMessage("🛑 Auto-posting stopped.", threadID, messageID);
  }
};

// Utility: Download image if not already cached
async function downloadImageIfNeeded(url, filePath) {
  if (fs.existsSync(filePath)) return;

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Placeholder functions — update with real selectors
async function getLottoResults() {
  try {
    const res = await axios.get("https://www.philippinepcsolotto.com/");
    const $ = cheerio.load(res.data);
    const result = $("div#game_result .lotto_result").first().text().trim();
    return result || "No Lotto result found.";
  } catch (err) {
    console.error("❌ Lotto fetch error:", err.message);
    return "⚠️ Lotto data unavailable.";
  }
}

async function getBingoPlusResults() {
  try {
    const res = await axios.get("https://www.bingoplus.com.ph/");
    const $ = cheerio.load(res.data);
    const result = $("div#bingo_winner .result").first().text().trim();
    return result || "No Bingo result found.";
  } catch (err) {
    console.error("❌ Bingo fetch error:", err.message);
    return "⚠️ Bingo Plus data unavailable.";
  }
}
