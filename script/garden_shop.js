module.exports.config = {
  name: "garden_shop",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gardenshop", "shop"],
  description: "Buy seeds for your garden",
  usages: "/garden shop [seed_key] [quantity]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args[0]) {
    let shopList = "🛒 Garden Shop - Seeds for sale:\n";
    for (const key in SEEDS) {
      shopList += `${SEEDS[key].emoji} ${key} — Price: ${SEEDS[key].price} coins\n`;
    }
    return api.sendMessage(shopList + "\nUsage: /garden shop [seed_key] [quantity]", threadID, messageID);
  }

  const seedKey = args[0].toLowerCase();
  if (!SEEDS[seedKey]) return api.sendMessage(`❌ Seed "${seedKey}" not found.`, threadID, messageID);

  const quantity = parseInt(args[1]) || 1;
  if (quantity < 1) return api.sendMessage("❌ Quantity must be at least 1.", threadID, messageID);

  const gardenData = await loadGardenData();
  if (!gardenData[senderID]) {
    gardenData[senderID] = { coins: 100, inventory: {}, plots: [] };
  }

  const totalCost = SEEDS[seedKey].price * quantity;
  if ((gardenData[senderID].coins || 0) < totalCost) {
    return api.sendMessage(`❌ You don't have enough coins. Need ${totalCost}.`, threadID, messageID);
  }

  gardenData[senderID].coins -= totalCost;
  gardenData[senderID].inventory[seedKey] = (gardenData[senderID].inventory[seedKey] || 0) + quantity;

  await saveGardenData(gardenData);
  return api.sendMessage(`🛒 Bought ${quantity}x ${SEEDS[seedKey].emoji} ${seedKey} seeds for ${totalCost} coins. Coins left: ${gardenData[senderID].coins}`, threadID, messageID);
};
