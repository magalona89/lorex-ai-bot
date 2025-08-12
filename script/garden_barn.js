module.exports.config = {
  name: "garden_barn",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gardenbarn", "barn"],
  description: "View your seeds, planted crops, and coins",
  usages: "/garden barn",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const gardenData = await loadGardenData();
  const userData = gardenData[senderID];

  if (!userData) return api.sendMessage("❌ No garden data found. Buy seeds from /garden shop!", threadID, messageID);

  const inventory = userData.inventory || {};
  const plots = userData.plots || [];

  const plantedCounts = {};
  for (const plot of plots) {
    plantedCounts[plot.seed] = (plantedCounts[plot.seed] || 0) + 1;
  }

  let msg = "🏡 Your Garden Barn:\n\nSeeds in Inventory:\n";
  if (Object.keys(inventory).length === 0) msg += "- None\n";
  else {
    for (const seed in inventory) {
      if (inventory[seed] > 0) msg += `${SEEDS[seed].emoji} ${seed}: ${inventory[seed]}\n`;
    }
  }

  msg += "\n🌿 Planted (growing):\n";
  if (Object.keys(plantedCounts).length === 0) msg += "- None\n";
  else {
    for (const seed in plantedCounts) {
      msg += `${SEEDS[seed].emoji} ${seed}: ${plantedCounts[seed]}\n`;
    }
  }

  msg += `\n💰 Coins: ${userData.coins || 0}`;

  api.sendMessage(msg, threadID, messageID);
};
