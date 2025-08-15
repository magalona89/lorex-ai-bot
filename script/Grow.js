const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const dataDir = path.join(__dirname, 'gardens');
fs.ensureDirSync(dataDir);

const shopItems = {
  apple: { emoji: "🍎", price: 40, type: "seed" },
  banana: { emoji: "🍌", price: 30, type: "seed" },
  chili: { emoji: "🌶️", price: 55, type: "seed" },
  carrots: { emoji: "🥕", price: 50, type: "seed" },
  melon: { emoji: "🍈", price: 60, type: "seed" },
  corn: { emoji: "🌽", price: 45, type: "seed" },
  honey: { emoji: "🍯", price: 80, type: "seed" },
  pineapple: { emoji: "🍍", price: 120, premium: true, type: "seed" },
  coconut: { emoji: "🥥", price: 110, type: "seed" },
  mango: { emoji: "🥭", price: 100, premium: true, type: "seed" },
  kiwi: { emoji: "🥝", price: 90, premium: true, type: "seed" },
  orange: { emoji: "🍊", price: 35, type: "seed" },
  broccoli: { emoji: "🥦", price: 50, type: "seed" },
  eggplant: { emoji: "🍆", price: 55, type: "seed" },
  strawberry: { emoji: "🍓", price: 65, type: "seed" },
  cherry: { emoji: "🍒", price: 70, type: "seed" },
  purplecabbage: { emoji: "🥬", price: 80, premium: true, type: "seed" },
  lemon: { emoji: "🍋", price: 40, type: "seed" },
  pinktulips: { emoji: "🌷", price: 75, premium: true, type: "seed" },
  lotus: { emoji: "🌸", price: 85, type: "seed" },
  megamushroom: { emoji: "🍄", price: 95, premium: true, type: "seed" },
  succulent: { emoji: "🪴", price: 100, type: "seed" },
  shovel: { emoji: "🛠️", price: 150, type: "gear" },
  wateringcan: { emoji: "💧", price: 120, type: "gear" },
  hat: { emoji: "🎩", price: 200, type: "cosmetic" },
  glasses: { emoji: "🕶️", price: 180, type: "cosmetic" }
};

const landPrices = {
  1: 100,
  5: 450,
  10: 800
};

const growStages = [
  "🟫 Soil is ready...",
  "🌱 Seed is planted...",
  "💧 Watering...",
  "🌿 A sprout appears!",
  "🌼 It's growing leaves...",
  "🌸 It's blooming!",
  "🌻 Fully grown!"
];

const admins = ["61575940656891"];

function isAdmin(id) {
  return admins.includes(id);
}

async function loadUserData(userID) {
  const file = path.join(dataDir, `${userID}.json`);
  if (await fs.pathExists(file)) {
    const data = await fs.readJson(file);
    data.inventory ??= {};
    data.gearStock ??= {};
    data.cosmetics ??= {};
    data.plant ??= null;
    data.coins ??= 100;
    data.premium ??= false;
    data.lastClaim ??= 0;
    data.totalEarned ??= 0;
    data.landPlots ??= { total: 1, used: 0 };
    return data;
  }
  return {
    coins: 100,
    inventory: {},
    gearStock: {},
    cosmetics: {},
    plant: null,
    premium: false,
    lastClaim: 0,
    totalEarned: 0,
    landPlots: { total: 1, used: 0 }
  };
}

async function saveUserData(userID, data) {
  const file = path.join(dataDir, `${userID}.json`);
  await fs.writeJson(file, data);
}

function getPhilippineTime() {
  return moment().tz("Asia/Manila").format("MMMM Do YYYY, h:mm:ss A");
}

function boxMessage(content) {
  return `╭─❒\n${content}\n╰────`;
}

module.exports.config = {
  name: "putikgarden",
  version: "4.0.0",
  hasPermission: 0,
  description: "Garden game with seeds, gear, cosmetics, premium, lands, admin commands",
  usages: "putikgarden <command> [args]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID } = event;
  const cmd = args[0]?.toLowerCase();

  const garden = await loadUserData(senderID);

  function canUse(item) {
    if (!item) return false;
    if (item.premium && !garden.premium) return false;
    return true;
  }

  // CLAIM
  if (cmd === "claim") {
    const now = Date.now();
    if (now - garden.lastClaim < 86400000) 
      return api.sendMessage(boxMessage("⏳ You can only claim once every 24 hours.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    garden.coins += 60000;
    garden.lastClaim = now;
    garden.totalEarned += 60000;
    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage("🎉 You claimed 60,000 coins!") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // SHOP
  if (cmd === "shop") {
    let msg = boxMessage("🛒 Garden Shop Items:\n");
    for (const [name, item] of Object.entries(shopItems)) {
      if (item.premium && !garden.premium) continue;
      msg += `${item.emoji} ${name} — 💰 ${item.price}\n`;
    }
    msg += "\n🌱 To buy land plots: putikgarden buyland <quantity>";
    if (!garden.premium) msg += "\n\n💎 Unlock premium seeds with: putikgarden premium (cost: 200 coins)";
    msg += `\n\n⏰ Current Time: ${getPhilippineTime()}`;
    return api.sendMessage(msg, threadID);
  }

  // BUY ITEM
  if (cmd === "buy") {
    const itemName = args[1]?.toLowerCase();
    if (!itemName || !shopItems[itemName]) 
      return api.sendMessage(boxMessage("❌ Invalid item. Use putikgarden shop") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    const item = shopItems[itemName];
    if (!canUse(item)) return api.sendMessage(boxMessage("❌ This is premium-only.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (garden.coins < item.price) return api.sendMessage(boxMessage("❌ Not enough coins.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    garden.coins -= item.price;
    if (item.type === "gear") garden.gearStock[itemName] = (garden.gearStock[itemName] || 0) + 1;
    else if (item.type === "cosmetic") garden.cosmetics[itemName] = (garden.cosmetics[itemName] || 0) + 1;
    else garden.inventory[itemName] = (garden.inventory[itemName] || 0) + 1;

    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`✅ Bought 1 ${item.emoji} ${itemName}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // BUY LAND
  if (cmd === "buyland") {
    let quantity = parseInt(args[1]);
    if (!quantity || quantity <= 0) return api.sendMessage(boxMessage("❌ Specify a valid number of lands.\nExample: putikgarden buyland 3") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    let price = landPrices[quantity] ?? (landPrices[1] * quantity);
    if (garden.coins < price) return api.sendMessage(boxMessage(`❌ Need ${price} coins to buy ${quantity} lands.`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    garden.coins -= price;
    garden.landPlots.total += quantity;
    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`🌿 You bought ${quantity} land(s) for ${price} coins! Total lands: ${garden.landPlots.total}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // INVENTORY
  if (cmd === "inventory") {
    let msg = boxMessage(`📦 Inventory:\nCoins: ${garden.coins}\nLands: ${garden.landPlots.used} / ${garden.landPlots.total}\n\n🍓 Seeds:\n`);
    if (!Object.keys(garden.inventory).length) msg += "None\n";
    else for (const [k, v] of Object.entries(garden.inventory)) msg += `${shopItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += "\n🛠️ Gear:\n";
    if (!Object.keys(garden.gearStock).length) msg += "None\n";
    else for (const [k, v] of Object.entries(garden.gearStock)) msg += `${shopItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += "\n🎨 Cosmetics:\n";
    if (!Object.keys(garden.cosmetics).length) msg += "None\n";
    else for (const [k, v] of Object.entries(garden.cosmetics)) msg += `${shopItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += `\n⏰ Current Time: ${getPhilippineTime()}`;
    return api.sendMessage(msg, threadID);
  }

  // PLANT
  if (cmd === "plant") {
    const seed = args[1]?.toLowerCase();
    if (!seed) return api.sendMessage(boxMessage("❌ Specify seed: putikgarden plant <seed>") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (!garden.inventory[seed] || garden.inventory[seed] <= 0) return api.sendMessage(boxMessage(`❌ You don't have any ${seed}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (garden.landPlots.used >= garden.landPlots.total) return api.sendMessage(boxMessage("❌ No free land plots. Buy more with putikgarden buyland <quantity>") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    const item = shopItems[seed];
    if (!item || !canUse(item) || item.type !== "seed") return api.sendMessage(boxMessage("❌ Invalid or premium seed.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    garden.inventory[seed]--;
    garden.plant = { name: seed, stage: 0 };
    garden.landPlots.used++;
    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`🌱 Planted ${item.emoji} ${seed}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // GROW
  if (cmd === "grow") {
    if (!garden.plant) return api.sendMessage(boxMessage("❌ You have no plant.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (garden.plant.stage >= growStages.length - 1) return api.sendMessage(boxMessage("🌻 Plant is fully grown! Use putikgarden harvest") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    garden.plant.stage++;
    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`${shopItems[garden.plant.name]?.emoji || "🌿"} ${garden.plant.name}: ${growStages[garden.plant.stage]}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // HARVEST
  if (cmd === "harvest") {
    if (!garden.plant) return api.sendMessage(boxMessage("❌ No plant to harvest.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (garden.plant.stage < growStages.length - 1) 
      return api.sendMessage(boxMessage("⏳ Your plant is not fully grown yet.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    const plantName = garden.plant.name;
    const item = shopItems[plantName];
    if (!item) return api.sendMessage(boxMessage("❌ Invalid plant data.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);

    // Reward coins based on plant price (example: 2x seed price)
    const reward = item.price * 2;

    garden.coins += reward;
    garden.plant = null;
    garden.landPlots.used--;

    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`🌻 You harvested ${item.emoji} ${plantName} and earned ${reward} coins!`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
  }

  // PREMIUM PURCHASE
  if (cmd === "premium") {
    if (garden.premium) return api.sendMessage(boxMessage("✅ You already have premium access.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID);
    if (garden.coins < 200) return api.sendMessage(boxMessage("❌ You need 200 coins to buy premium.") + `\n⏰ Current Time
