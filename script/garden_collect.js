const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "..", "data");
const GARDEN_FILE = path.join(DATA_PATH, "garden.json");

const SEEDS = {
  carrot: { emoji: "🥕", price: 10, growTime: 60 * 5 },
  sunflower: { emoji: "🌻", price: 15, growTime: 60 * 3 }
};

async function loadGardenData() {
  try {
    await fs.ensureDir(DATA_PATH);
    if (!fs.existsSync(GARDEN_FILE)) await fs.writeFile(GARDEN_FILE, "{}");
    const data = await fs.readFile(GARDEN_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveGardenData(data) {
  await fs.writeFile(GARDEN_FILE, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "garden_collect",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gardencollect", "collect"],
  description: "Collect (harvest) your grown plants",
  usages: "/garden collect",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const gardenData = await loadGardenData();
  const userData = gardenData[senderID];
  if (!userData) return api.sendMessage("❌ You have no garden data. Buy and plant seeds first!", threadID, messageID);

  const now = Date.now();
  const readyPlots = userData.plots.filter(plot => plot.readyAt <= now);
  if (readyPlots.length === 0) return api.sendMessage("🌱 No plants are ready to harvest yet.", threadID, messageID);

  // Add harvested seeds to inventory (same seed key)
  for (const plot of readyPlots) {
    userData.inventory[plot.seed] = (userData.inventory[plot.seed] || 0) + 1;
  }

  // Remove harvested plots
  userData.plots = userData.plots.filter(plot => plot.readyAt > now);

  await saveGardenData(gardenData);

  let msg = `🌿 You harvested ${readyPlots.length} plant${readyPlots.length > 1 ? "s" : ""}!\n\n`;
  const counts = {};
  for (const plot of readyPlots) {
    counts[plot.seed] = (counts[plot.seed] || 0) + 1;
  }
  for (const seed in counts) {
    msg += `${SEEDS[seed].emoji} ${seed}: ${counts[seed]}\n`;
  }

  api.sendMessage(msg, threadID, messageID);
};
