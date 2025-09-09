module.exports.config = {
  name: "posta",
  version: "1.4.0",
  description: "Auto post fruit prices, garden & harvest status, time (no photos)",
  usage: "post autopost on | autopost off",
  role: 0,
  author: "ChatGPT",
};

let autoPostInterval = null;
let isAutoPosting = false;

const fruits = [
  { name: "Watermelon", min: 60, max: 90, unit: "per kg" },
  { name: "Mango", min: 130, max: 160, unit: "per kg" },
  { name: "Avocado", min: 300, max: 600, unit: "per kg" },
  { name: "Grapes", min: 200, max: 300, unit: "per kg" },
  { name: "Star Fruit", min: 146, max: 173, unit: "per kg" },
  { name: "Dragon Fruit", min: 130, max: 240, unit: "per kg" },
];

const waterPriceRange = { min: 20, max: 50, unit: "per liter" };
const eggPriceRange = { min: 70, max: 120, unit: "per dozen" };

const statuses = ["Stable", "Rising", "Falling"];
const gardenStatusOptions = ["Good", "Fair", "Needs Attention"];
const harvestStatusOptions = ["Ongoing", "Completed", "Delayed"];

function getRandomPrice(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomStatus() {
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomGardenStatus() {
  return gardenStatusOptions[Math.floor(Math.random() * gardenStatusOptions.length)];
}

function getRandomHarvestStatus() {
  return harvestStatusOptions[Math.floor(Math.random() * harvestStatusOptions.length)];
}

function generateReport() {
  const phTime = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  let report = "🍍 Fruit & Goods Price Tracker Report 🍉\n\n";

  const gardenStatus = getRandomGardenStatus();
  const harvestStatus = getRandomHarvestStatus();

  report += `🌿 Garden Status: ${gardenStatus}\n`;
  report += `🌾 Harvest Status: ${harvestStatus}\n\n`;

  for (const fruit of fruits) {
    const price = getRandomPrice(fruit.min, fruit.max);
    const status = getRandomStatus();
    report += `- ${fruit.name}: ₱${price} ${fruit.unit} (${status})\n`;
  }

  const waterPrice = getRandomPrice(waterPriceRange.min, waterPriceRange.max);
  const waterStatus = getRandomStatus();
  report += `- Water: ₱${waterPrice} ${waterPriceRange.unit} (${waterStatus})\n`;

  const eggPrice = getRandomPrice(eggPriceRange.min, eggPriceRange.max);
  const eggStatus = getRandomStatus();
  report += `- Eggs: ₱${eggPrice} ${eggPriceRange.unit} (${eggStatus})\n`;

  report += `\n🕒 Updated at: ${phTime} (Philippine Time)`;

  return report;
}

module.exports.onStart = async function ({ api, event }) {
  const args = event.body.slice(5).trim().split(" ");
  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const threadID = event.threadID;
  const replyToId = event.messageID;

  if (command === "autopost") {
    if (subCommand === "on") {
      if (isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already ON!", threadID, replyToId);
      }

      isAutoPosting = true;
      autoPostInterval = setInterval(async () => {
        const report = generateReport();
        try {
          await api.createPost(report);
        } catch (err) {
          console.error("❌ Auto-post failed:", err);
        }
      }, 360000); // every 6 minutes

      return api.sendMessage(
        "✅ Auto-post fruit price tracker turned ON! Posting every 6 minutes.",
        threadID,
        replyToId
      );
    }

    if (subCommand === "off") {
      if (!isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already OFF!", threadID, replyToId);
      }

      isAutoPosting = false;
      clearInterval(autoPostInterval);
      autoPostInterval = null;

      return api.sendMessage("❌ Auto-post fruit price tracker turned OFF.", threadID, replyToId);
    }

    return api.sendMessage("❓ Usage: post autopost on | autopost off", threadID, replyToId);
  }

  return api.sendMessage("❗ Invalid command. Usage:\npost autopost on | autopost off", threadID, replyToId);
};
