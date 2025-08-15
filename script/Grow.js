const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

const dataDir = path.join(__dirname, 'gagstocks');
fs.ensureDirSync(dataDir);

const stockItems = {
  gagco: { emoji: '📈', price: 100, type: 'stock' },
  stockx: { emoji: '💹', price: 120, type: 'stock', premium: true },
  funbiz: { emoji: '🏢', price: 90, type: 'stock' },
  tokyo: { emoji: '🗼', price: 150, type: 'stock', premium: true },
  techup: { emoji: '💻', price: 110, type: 'stock' },
  foodmart: { emoji: '🍔', price: 80, type: 'stock' },
  greenenergy: { emoji: '🌿', price: 130, type: 'stock', premium: true },
  booster: { emoji: '⚡', price: 200, type: 'gear' }, // boosts growth speed
  hat: { emoji: '🎩', price: 180, type: 'cosmetic' }
};

const landPrices = {
  1: 150,
  5: 700,
  10: 1300
};

const growStages = [
  '📉 Stock is low...',
  '📈 Stock is improving...',
  '💹 Stock is growing...',
  '🚀 Stock is booming!',
  '🏆 Stock reached peak value!'
];

const admins = ['61575940656891'];

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
    data.stockPortfolio ??= null;
    data.coins ??= 100;
    data.premium ??= false;
    data.lastClaim ??= 0;
    data.totalEarned ??= 0;
    data.landPlots ??= { total: 1, used: 0 };
    data.boostActive ??= false;
    data.boostExpire ??= 0;
    return data;
  }
  return {
    coins: 100,
    inventory: {},
    gearStock: {},
    cosmetics: {},
    stockPortfolio: null,
    premium: false,
    lastClaim: 0,
    totalEarned: 0,
    landPlots: { total: 1, used: 0 },
    boostActive: false,
    boostExpire: 0
  };
}

async function saveUserData(userID, data) {
  const file = path.join(dataDir, `${userID}.json`);
  await fs.writeJson(file, data);
}

function getPhilippineTime() {
  return moment().tz('Asia/Manila').format('MMMM Do YYYY, h:mm:ss A');
}

function boxMessage(content) {
  return `╭─❒\n${content}\n╰────`;
}

// Automatically grow stocks on each command if tracking
async function processGrowth(api, threadID, userID, userData) {
  if (!userData.stockPortfolio) return;

  const now = Date.now();
  let growthSpeed = 1; // normal growth stage per cycle

  // Boost doubles growth speed
  if (userData.boostActive && userData.boostExpire > now) growthSpeed = 2;
  else if (userData.boostExpire <= now) {
    userData.boostActive = false;
    userData.boostExpire = 0;
    await saveUserData(userID, userData);
  }

  userData.stockPortfolio.stage += growthSpeed;
  if (userData.stockPortfolio.stage >= growStages.length) {
    userData.stockPortfolio.stage = growStages.length - 1; // max stage
  }

  await saveUserData(userID, userData);

  const stock = userData.stockPortfolio.name;
  const stageMsg = growStages[userData.stockPortfolio.stage];
  const emoji = stockItems[stock]?.emoji || '❓';

  // Auto send group update message
  api.sendMessage(boxMessage(`📢 Update for ${emoji} ${stock}:\n${stageMsg}\n⏰ ${getPhilippineTime()}`), threadID);
}

module.exports.config = {
  name: "gagstock",
  version: "7.8.9.2",
  hasPermission: 0,
  description: "Stock tracker with garden-style features: land, growth, boosts, premium, cosmetics.",
  usages: "gagstock <command> [args]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID } = event;
  const cmd = args[0]?.toLowerCase();

  const userData = await loadUserData(senderID);

  function canUse(item) {
    if (!item) return false;
    if (item.premium && !userData.premium) return false;
    return true;
  }

  // Process growth automatically on each command usage
  await processGrowth(api, threadID, senderID, userData);

  if (cmd === "claim") {
    const now = Date.now();
    if (now - userData.lastClaim < 86400000)
      return api.sendMessage(boxMessage("⏳ You can only claim once every 24 hours.") + `\n⏰ ${getPhilippineTime()}`, threadID);

    const claimAmount = 50000;
    userData.coins += claimAmount;
    userData.lastClaim = now;
    userData.totalEarned += claimAmount;
    await saveUserData(senderID, userData);

    return api.sendMessage(boxMessage(`🎉 You claimed ${claimAmount} coins!`) + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "shop") {
    let msg = boxMessage("🛒 Stock Market Shop:\n");
    for (const [name, item] of Object.entries(stockItems)) {
      if (item.premium && !userData.premium) continue;
      msg += `${item.emoji} ${name} — 💰 ${item.price}\n`;
    }
    msg += "\n🏞️ To buy land plots: gagstock buyland <quantity>";
    if (!userData.premium) msg += "\n\n💎 Unlock premium stocks with: gagstock premium (cost: 300 coins)";
    msg += `\n\n⏰ ${getPhilippineTime()}`;
    return api.sendMessage(msg, threadID);
  }

  if (cmd === "buy") {
    const itemName = args[1]?.toLowerCase();
    if (!itemName || !stockItems[itemName])
      return api.sendMessage(boxMessage("❌ Invalid item. Use gagstock shop") + `\n⏰ ${getPhilippineTime()}`, threadID);

    const item = stockItems[itemName];
    if (!canUse(item)) return api.sendMessage(boxMessage("❌ This is premium-only.") + `\n⏰ ${getPhilippineTime()}`, threadID);
    if (userData.coins < item.price) return api.sendMessage(boxMessage("❌ Not enough coins.") + `\n⏰ ${getPhilippineTime()}`, threadID);

    userData.coins -= item.price;
    if (item.type === "gear") userData.gearStock[itemName] = (userData.gearStock[itemName] || 0) + 1;
    else if (item.type === "cosmetic") userData.cosmetics[itemName] = (userData.cosmetics[itemName] || 0) + 1;
    else userData.inventory[itemName] = (userData.inventory[itemName] || 0) + 1;

    await saveUserData(senderID, userData);
    return api.sendMessage(boxMessage(`✅ Bought 1 ${item.emoji} ${itemName}`) + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "buyland") {
    let quantity = parseInt(args[1]);
    if (!quantity || quantity <= 0)
      return api.sendMessage(boxMessage("❌ Specify a valid number of lands.\nExample: gagstock buyland 3") + `\n⏰ ${getPhilippineTime()}`, threadID);

    let price = landPrices[quantity] ?? (landPrices[1] * quantity);
    if (userData.coins < price) return api.sendMessage(boxMessage(`❌ Need ${price} coins to buy ${quantity} land(s).`) + `\n⏰ ${getPhilippineTime()}`, threadID);

    userData.coins -= price;
    userData.landPlots.total += quantity;
    await saveUserData(senderID, userData);
    return api.sendMessage(boxMessage(`🌿 You bought ${quantity} land(s) for ${price} coins! Total lands: ${userData.landPlots.total}`) + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "inventory") {
    let msg = boxMessage(`📦 Inventory:\nCoins: ${userData.coins}\nLands used: ${userData.landPlots.used} / ${userData.landPlots.total}\n\n📈 Stocks:\n`);
    if (!Object.keys(userData.inventory).length) msg += "None\n";
    else for (const [k, v] of Object.entries(userData.inventory)) msg += `${stockItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += "\n🛠️ Gear:\n";
    if (!Object.keys(userData.gearStock).length) msg += "None\n";
    else for (const [k, v] of Object.entries(userData.gearStock)) msg += `${stockItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += "\n🎨 Cosmetics:\n";
    if (!Object.keys(userData.cosmetics).length) msg += "None\n";
    else for (const [k, v] of Object.entries(userData.cosmetics)) msg += `${stockItems[k]?.emoji || "❓"} ${k}: ${v}\n`;

    msg += `\n⏰ ${getPhilippineTime()}`;
    return api.sendMessage(msg, threadID);
  }

  if (cmd === "track") {
    const stock = args[1]?.toLowerCase();
    if (!stock) return api.sendMessage(boxMessage("❌ Specify stock: gagstock track <stock>") + `\n⏰ ${getPhilippineTime()}`, threadID);
    if (!userData.inventory[stock] || userData.inventory[stock] <= 0)
      return api.sendMessage(boxMessage(`❌ You don't have any ${stock}`) + `\n⏰ ${getPhilippineTime()}`, threadID);
    if (userData.landPlots.used >= userData.landPlots.total)
      return api.sendMessage(boxMessage("❌ No free land plots. Buy more with gagstock buyland <quantity>") + `\n⏰ ${getPhilippineTime()}`, threadID);

    const item = stockItems[stock];
    if (!item || !canUse(item) || item.type !== "stock")
      return api.sendMessage(boxMessage("❌ Invalid or premium stock.") + `\n⏰ ${getPhilippineTime()}`, threadID);

    userData.inventory[stock]--;
    userData.stockPortfolio = { name: stock, stage: 0 };
    userData.landPlots.used++;
    await saveUserData(senderID, userData);
    return api.sendMessage(boxMessage(`📈 Started tracking stock ${item.emoji} ${stock}`) + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "boost") {
    if (!userData.gearStock['booster'] || userData.gearStock['booster'] <= 0)
      return api.sendMessage(boxMessage("❌ You don't have any ⚡ booster to activate.") + `\n⏰ ${getPhilippineTime()}`, threadID);

    if (userData.boostActive && userData.boostExpire > Date.now())
      return api.sendMessage(boxMessage("⚡ Booster already active."), threadID);

    userData.gearStock['booster']--;
    userData.boostActive = true;
    userData.boostExpire = Date.now() + 1000 * 60 * 30; // 30 minutes boost
    await saveUserData(senderID, userData);

    return api.sendMessage(boxMessage("⚡ Booster activated for 30 minutes!") + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "status") {
    if (!userData.stockPortfolio)
      return api.sendMessage(boxMessage("❌ You're not tracking any stock right now.") + `\n⏰ ${getPhilippineTime()}`, threadID);

    const stock = userData.stockPortfolio.name;
    const stage = userData.stockPortfolio.stage;
    const emoji = stockItems[stock]?.emoji || '❓';
    const stageMsg = growStages[stage];

    let boostMsg = "";
    if (userData.boostActive && userData.boostExpire > Date.now()) {
      const remaining = Math.floor((userData.boostExpire - Date.now()) / 60000);
      boostMsg = `\n⚡ Booster active for ${remaining} more minutes`;
    } else boostMsg = "\n⚡ Booster not active";

    return api.sendMessage(boxMessage(`📊 Tracking: ${emoji} ${stock}\nStage: ${stage} - ${stageMsg}${boostMsg}\nLands used: ${userData.landPlots.used} / ${userData.landPlots.total}`) + `\n⏰ ${getPhilippineTime()}`, threadID);
  }

  if (cmd === "premium") {
    if (userData.premium) return api.sendMessage(boxMessage("💎 You already have premium."), threadID);

    const cost = 300;
    if (userData.coins < cost) return api.sendMessage(boxMessage(`❌ Need ${cost} coins for premium.`), threadID);

    userData.coins -= cost;
    userData.premium = true;
    await saveUserData(senderID, userData);
    return api.sendMessage(boxMessage("💎 Premium activated! You can now buy premium stocks."), threadID);
  }

  return api.sendMessage(boxMessage("❌ Unknown command. Use gagstock shop to see commands.") + `\n⏰ ${getPhilippineTime()}`, threadID);
};
