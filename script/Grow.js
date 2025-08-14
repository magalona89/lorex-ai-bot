const fs = require('fs-extra');
const path = require('path');

// ===================== 🌿 CONFIGURATION =====================
const gardenPath = path.join(__dirname, 'gardens');

const shopItems = {
  apple: { emoji: "🍎", price: 40 },
  banana: { emoji: "🍌", price: 30 },
  chili: { emoji: "🌶️", price: 55 },
  carrots: { emoji: "🥕", price: 50 },
  melon: { emoji: "🍈", price: 60 },
  corn: { emoji: "🌽", price: 45 },
  honey: { emoji: "🍯", price: 80 },

  pineapple: { emoji: "🍍", price: 120, premium: true },
  coconut: { emoji: "🥥", price: 110 },
  mango: { emoji: "🥭", price: 100, premium: true },
  kiwi: { emoji: "🥝", price: 90, premium: true },
  orange: { emoji: "🍊", price: 35 }
};

const growStages = [
  "🟫 Soil is ready...",
  "🌱 Seed is planted...",
  "💧 Watering...",
  "🌿 A sprout appears!",
  "🌼 It's growing leaves...",
  "🌸 It's blooming!",
  "🌻 Your plant is fully grown!"
];

// ===================== 🧠 UTILITIES =====================
async function loadGarden(userID) {
  await fs.ensureDir(gardenPath);
  const file = path.join(gardenPath, `${userID}.json`);
  if (await fs.exists(file)) {
    const data = await fs.readJson(file);
    if (typeof data.totalEarned !== 'number') data.totalEarned = 0;
    return data;
  }
  return {
    coins: 100,
    inventory: {},
    plant: null,
    lastClaim: 0,
    premium: false,
    totalEarned: 0
  };
}
async function saveGarden(userID, data) {
  await fs.writeJson(path.join(gardenPath, `${userID}.json`), data);
}
async function deleteGarden(userID) {
  await fs.remove(path.join(gardenPath, `${userID}.json`));
}

// ===================== 📜 COMMAND HANDLER =====================
module.exports.config = {
  name: 'putikgarden',
  version: '3.0.0',
  hasPermission: 0,
  description: 'Garden game with premium and many seeds.',
  usages: 'garden <subcommand>',
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID } = event;
  const sub = args[0]?.toLowerCase();
  const garden = await loadGarden(senderID);

  // ======= PREMIUM =======
  if (sub === 'premium') {
    if (garden.premium) {
      return api.sendMessage("💎 You already have Garden Premium!\nEnjoy premium seeds in the shop!", threadID);
    }
    if (garden.coins < 200) {
      return api.sendMessage("❌ You need 💰 200 coins to buy Garden Premium.", threadID);
    }

    garden.coins -= 200;
    garden.premium = true;
    await saveGarden(senderID, garden);
    return api.sendMessage("✅ You unlocked 🌟 Garden Premium!\nCheck the shop for exclusive seeds!", threadID);
  }

  // ======= SHOP =======
  if (sub === 'shop') {
    let msg = "🛍️ Garden Shop:\n";
    for (let [name, item] of Object.entries(shopItems)) {
      if (item.premium && !garden.premium) continue;
      msg += `${item.emoji} ${name} — 💰 ${item.price} coins\n`;
    }
    if (!garden.premium) msg += "\n💎 Unlock more seeds: garden premium (200 coins)";
    return api.sendMessage(msg, threadID);
  }

  // ======= BUY =======
  if (sub === 'buy') {
    const fruit = args[1]?.toLowerCase();
    const item = shopItems[fruit];
    if (!item || (item.premium && !garden.premium)) {
      return api.sendMessage("❌ Invalid or locked fruit. Try: garden shop", threadID);
    }
    if (garden.coins < item.price) {
      return api.sendMessage(`💸 Not enough coins to buy ${item.emoji} ${fruit}.`, threadID);
    }

    garden.coins -= item.price;
    garden.inventory[fruit] = (garden.inventory[fruit] || 0) + 1;
    await saveGarden(senderID, garden);
    return api.sendMessage(`✅ Bought 1 ${item.emoji} ${fruit}!\n💰 Coins left: ${garden.coins}`, threadID);
  }

  // ======= INVENTORY =======
  if (sub === 'inventory') {
    let msg = `📦 Inventory:\n💰 Coins: ${garden.coins}\n`;
    const keys = Object.keys(garden.inventory);
    if (!keys.length) msg += "You don't own any fruits.";
    else {
      for (let key of keys) {
        const item = shopItems[key];
        msg += `${item?.emoji || "❓"} ${key}: ${garden.inventory[key]}\n`;
      }
    }
    return api.sendMessage(msg, threadID);
  }

  // ======= PLANT =======
  if (sub === 'plant') {
    const fruit = args[1]?.toLowerCase();
    const item = shopItems[fruit];
    if (!item || (item.premium && !garden.premium))
      return api.sendMessage("❌ Invalid fruit. Use: garden shop", threadID);
    if (!garden.inventory[fruit] || garden.inventory[fruit] < 1)
      return api.sendMessage(`❌ You don't own ${item.emoji} ${fruit}.`, threadID);

    garden.inventory[fruit] -= 1;
    garden.plant = {
      name: `${item.emoji} ${fruit}`,
      stage: 0
    };
    await saveGarden(senderID, garden);
    return api.sendMessage(`🪴 Planted ${item.emoji} ${fruit}!\nUse: garden grow`, threadID);
  }

  // ======= GROW =======
  if (sub === 'grow') {
    if (!garden.plant)
      return api.sendMessage("🌱 No plant yet. Use: garden plant <fruit>", threadID);
    const stage = garden.plant.stage;
    if (stage >= growStages.length)
      return api.sendMessage(`🌻 ${garden.plant.name} is already fully grown!\nUse: garden harvest`, threadID);
    const msg = growStages[stage];
    garden.plant.stage += 1;
    await saveGarden(senderID, garden);
    return api.sendMessage(`🌿 ${garden.plant.name}: ${msg}`, threadID);
  }

  // ======= STATUS =======
  if (sub === 'status') {
    if (!garden.plant)
      return api.sendMessage("🪴 You haven't planted anything.", threadID);
    return api.sendMessage(`🧑‍🌾 ${garden.plant.name}\n🌿 Stage: ${garden.plant.stage}/${growStages.length - 1}\nUse: garden grow`, threadID);
  }

  // ======= HARVEST =======
  if (sub === 'harvest') {
    if (!garden.plant)
      return api.sendMessage("🌱 Nothing to harvest. Plant something first.", threadID);
    if (garden.plant.stage < growStages.length)
      return api.sendMessage(`⏳ ${garden.plant.name} isn't ready yet. Use: garden grow`, threadID);
    const fruit = garden.plant.name.split(" ")[1];
    const base = shopItems[fruit]?.price || 40;
    const earned = Math.floor(base * 0.75);
    garden.coins += earned;
    garden.totalEarned += earned;
    garden.plant = null;
    await saveGarden(senderID, garden);
    return api.sendMessage(`🌾 You harvested ${fruit} and earned 💰 ${earned} coins!`, threadID);
  }

  // ======= RESET =======
  if (sub === 'reset') {
    await deleteGarden(senderID);
    return api.sendMessage("🔁 Garden reset complete.", threadID);
  }

  // ======= CLAIM =======
  if (sub === 'claim') {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - garden.lastClaim < oneDay) {
      const hrs = Math.ceil((oneDay - (now - garden.lastClaim)) / 3600000);
      return api.sendMessage(`🕒 Already claimed. Try again in ${hrs} hour(s).`, threadID);
    }
    garden.lastClaim = now;
    garden.coins += 50;
    garden.totalEarned += 50;
    await saveGarden(senderID, garden);
    return api.sendMessage("🎉 Claimed 50 daily coins!", threadID);
  }

  // ======= BALANCE =======
  if (sub === 'balance') {
    return api.sendMessage(
      `💰 Current Coins: ${garden.coins}\n` +
      `🏆 Total Earned: ${garden.totalEarned} coins`,
      threadID
    );
  }

  return api.sendMessage(
    "⚠️ Invalid command. Use:\n" +
    "garden shop\n" +
    "garden buy <fruit>\n" +
    "garden plant <fruit>\n" +
    "garden grow\n" +
    "garden harvest\n" +
    "garden inventory\n" +
    "garden claim\n" +
    "garden balance\n" +
    "garden premium\n" +
    "garden reset",
    threadID
  );
};
