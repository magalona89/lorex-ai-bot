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
  10: 800,
};

async function loadUserData(userID) {
  const file = path.join(dataDir, `${userID}.json`);
  if (await fs.pathExists(file)) {
    const data = await fs.readJson(file);
    data.inventory ??= {};
    data.gearStock ??= {};
    data.cosmetics ??= {};
    data.coins ??= 100;
    data.premium ??= false;
    data.lastClaim ??= 0;
    data.landPlots ??= { total: 1, used: 0 };
    return data;
  }
  return {
    coins: 100,
    inventory: {},
    gearStock: {},
    cosmetics: {},
    premium: false,
    lastClaim: 0,
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
  version: "4.1.0",
  hasPermission: 0,
  description: "Garden game with coins, seeds, gear, cosmetics, premium, lands",
  usages: "putikgarden <command> [args]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const cmd = args[0]?.toLowerCase();

  const garden = await loadUserData(senderID);

  function canUse(item) {
    if (!item) return false;
    if (item.premium && !garden.premium) return false;
    return true;
  }

  // CLAIM DAILY COINS
  if (cmd === "claim") {
    const now = Date.now();
    if (now - garden.lastClaim < 86400000) {
      return api.sendMessage(boxMessage("⏳ You can only claim once every 24 hours.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
    }
    garden.coins += 60000;
    garden.lastClaim = now;
    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage("🎉 You claimed 60,000 coins!") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
  }

  // SHOW SHOP
  if (cmd === "shop") {
    let msg = boxMessage("🛒 Garden Shop Items:\n");
    for (const [name, item] of Object.entries(shopItems)) {
      if (item.premium && !garden.premium) continue;
      msg += `${item.emoji} ${name} — 💰 ${item.price}\n`;
    }
    msg += "\n🌱 To buy land plots: putikgarden buyland <quantity>";
    if (!garden.premium) msg += "\n\n💎 Unlock premium seeds with: putikgarden premium (cost: 200 coins)";
    msg += `\n\n⏰ Current Time: ${getPhilippineTime()}`;
    return api.sendMessage(msg, threadID, messageID);
  }

  // BUY ITEM
  if (cmd === "buy") {
    const itemName = args[1]?.toLowerCase();
    if (!itemName || !shopItems[itemName]) {
      return api.sendMessage(boxMessage("❌ Invalid item. Use putikgarden shop") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
    }
    const item = shopItems[itemName];
    if (!canUse(item)) {
      return api.sendMessage(boxMessage("❌ This is premium-only.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
    }
    if (garden.coins < item.price) {
      return api.sendMessage(boxMessage("❌ Not enough coins.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
    }

    garden.coins -= item.price;
    if (item.type === "gear") garden.gearStock[itemName] = (garden.gearStock[itemName] || 0) + 1;
    else if (item.type === "cosmetic") garden.cosmetics[itemName] = (garden.cosmetics[itemName] || 0) + 1;
    else garden.inventory[itemName] = (garden.inventory[itemName] || 0) + 1;

    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`✅ Bought 1 ${item.emoji} ${itemName}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
  }

  // BUY LAND
  if (cmd === "buyland") {
    if (args.length < 2) return api.sendMessage(boxMessage("❌ Specify land quantity: putikgarden buyland <quantity>"), threadID, messageID);
    const qty = parseInt(args[1], 10);
    if (isNaN(qty) || qty <= 0) return api.sendMessage(boxMessage("❌ Invalid quantity."), threadID, messageID);

    let totalPrice = 0;
    if (landPrices[qty]) {
      totalPrice = landPrices[qty];
    } else {
      totalPrice = qty * 100; // fallback price per land
    }

    if (garden.coins < totalPrice) {
      return api.sendMessage(boxMessage(`❌ You need ${totalPrice} coins to buy ${qty} land plots.`), threadID, messageID);
    }

    garden.coins -= totalPrice;
    garden.landPlots.total += qty;

    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage(`🌱 You bought ${qty} land plots for ${totalPrice} coins.\nTotal Land: ${garden.landPlots.total}`) + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
  }

  // PREMIUM PURCHASE
  if (cmd === "premium") {
    if (garden.premium) return api.sendMessage(boxMessage("✅ You already have premium."), threadID, messageID);
    if (garden.coins < 200) return api.sendMessage(boxMessage("❌ You need 200 coins to unlock premium."), threadID, messageID);

    garden.coins -= 200;
    garden.premium = true;

    await saveUserData(senderID, garden);
    return api.sendMessage(boxMessage("🎉 Premium unlocked! You can now buy premium seeds.") + `\n⏰ Current Time: ${getPhilippineTime()}`, threadID, messageID);
  }

  // Default unknown command response
  return api.sendMessage(
    boxMessage("❌ Unknown command.\nUsage:\n- putikgarden claim\n- putikgarden shop\n- putikgarden buy <item>\n- putikgarden buyland <qty>\n- putikgarden premium"),
    threadID,
    messageID
  );
};
