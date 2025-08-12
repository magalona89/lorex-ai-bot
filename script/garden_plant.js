module.exports.config = {
  name: "garden_plant",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gardenplant", "plant"],
  description: "Plant seeds in your garden (uses your inventory)",
  usages: "/garden plant [seed_key] [quantity]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) return api.sendMessage("❌ Specify seed. Example: /garden plant carrot 1", threadID, messageID);
  const seedKey = args[0].toLowerCase();

  if (!SEEDS[seedKey]) return api.sendMessage(`❌ Seed "${seedKey}" not found.`, threadID, messageID);

  const quantity = parseInt(args[1]) || 1;
  if (quantity < 1) return api.sendMessage("❌ Quantity must be at least 1.", threadID, messageID);

  const gardenData = await loadGardenData();
  if (!gardenData[senderID]) gardenData[senderID] = { coins: 100, inventory: {}, plots: [] };

  const userSeeds = gardenData[senderID].inventory[seedKey] || 0;
  if (userSeeds < quantity) {
    return api.sendMessage(`❌ You have only ${userSeeds} ${seedKey} seed(s). Buy more at /garden shop`, threadID, messageID);
  }

  gardenData[senderID].inventory[seedKey] -= quantity;
  for (let i = 0; i < quantity; i++) {
    gardenData[senderID].plots.push({
      seed: seedKey,
      plantedAt: Date.now(),
      readyAt: Date.now() + SEEDS[seedKey].growTime * 1000
    });
  }

  await saveGardenData(gardenData);
  return api.sendMessage(`🌱 Planted ${quantity}x ${SEEDS[seedKey].emoji} ${seedKey}(s). Ready in ${SEEDS[seedKey].growTime / 60} minutes!`, threadID, messageID);
};
