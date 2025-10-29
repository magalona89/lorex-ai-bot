
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'data.json');

function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, JSON.stringify({}, null, 2));
    }
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function getUserData(senderId) {
  const data = loadData();
  if (!data.gagstockgame) data.gagstockgame = {};
  if (!data.gagstockgame[senderId]) {
    data.gagstockgame[senderId] = {
      coins: 1000,
      inventory: [],
      level: 1,
      xp: 0,
      lastPlayed: Date.now()
    };
  }
  return data;
}

const items = [
  { name: "Apple", emoji: "🍎", price: 50, sellPrice: 30 },
  { name: "Carrot", emoji: "🥕", price: 30, sellPrice: 18 },
  { name: "Banana", emoji: "🍌", price: 25, sellPrice: 15 },
  { name: "Tomato", emoji: "🍅", price: 40, sellPrice: 24 },
  { name: "Cabbage", emoji: "🥬", price: 35, sellPrice: 21 },
  { name: "Eggplant", emoji: "🍆", price: 28, sellPrice: 17 },
  { name: "Pineapple", emoji: "🍍", price: 60, sellPrice: 36 },
  { name: "Watermelon", emoji: "🍉", price: 70, sellPrice: 42 },
  { name: "Grapes", emoji: "🍇", price: 45, sellPrice: 27 },
  { name: "Strawberry", emoji: "🍓", price: 55, sellPrice: 33 }
];

module.exports.config = {
  name: "gagstockgame",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gsg", "stockgame"],
  description: "Play gagstock farming game - buy, sell, and grow your garden!",
  usages: "shop | buy [item] | sell [item] | inventory | profile",
  cooldowns: 3
};

module.exports.execute = async function({ sendMessage }, senderId, args, pageAccessToken) {
  const subcmd = args[0]?.toLowerCase();

  if (!subcmd || subcmd === "help") {
    return sendMessage(senderId, {
      text: `🌾 𝗚𝗮𝗴𝗦𝘁𝗼𝗰𝗸 𝗚𝗮𝗺𝗲 𝗛𝗲𝗹𝗽\n\n` +
            `📋 Commands:\n` +
            `• gagstockgame shop - View available items\n` +
            `• gagstockgame buy [item] - Buy an item\n` +
            `• gagstockgame sell [item] - Sell an item\n` +
            `• gagstockgame inventory - View your inventory\n` +
            `• gagstockgame profile - View your profile\n` +
            `• gagstockgame daily - Claim daily reward`
    }, pageAccessToken);
  }

  if (subcmd === "shop") {
    let shopList = "🏪 𝗚𝗮𝗴𝗦𝘁𝗼𝗰𝗸 𝗦𝗵𝗼𝗽\n\n";
    items.forEach((item, idx) => {
      shopList += `${idx + 1}. ${item.emoji} ${item.name}\n   💰 Price: ${item.price} coins\n   💵 Sell: ${item.sellPrice} coins\n\n`;
    });
    return sendMessage(senderId, { text: shopList }, pageAccessToken);
  }

  if (subcmd === "buy") {
    const itemName = args.slice(1).join(" ").toLowerCase();
    if (!itemName) {
      return sendMessage(senderId, { text: "⚠️ Usage: gagstockgame buy [item name]" }, pageAccessToken);
    }

    const item = items.find(i => i.name.toLowerCase() === itemName);
    if (!item) {
      return sendMessage(senderId, { text: "❌ Item not found in shop!" }, pageAccessToken);
    }

    const data = getUserData(senderId);
    const userData = data.gagstockgame[senderId];

    if (userData.coins < item.price) {
      return sendMessage(senderId, {
        text: `❌ Not enough coins!\nYou have: ${userData.coins} coins\nNeed: ${item.price} coins`
      }, pageAccessToken);
    }

    userData.coins -= item.price;
    userData.inventory.push(item.name);
    userData.xp += 10;
    
    if (userData.xp >= userData.level * 100) {
      userData.level++;
      saveData(data);
      return sendMessage(senderId, {
        text: `✅ Bought ${item.emoji} ${item.name} for ${item.price} coins!\n\n🎉 LEVEL UP! You're now level ${userData.level}!\n💰 Coins left: ${userData.coins}\n⭐ XP: ${userData.xp}`
      }, pageAccessToken);
    }

    saveData(data);
    return sendMessage(senderId, {
      text: `✅ Bought ${item.emoji} ${item.name} for ${item.price} coins!\n💰 Coins left: ${userData.coins}\n⭐ XP: ${userData.xp}/${userData.level * 100}`
    }, pageAccessToken);
  }

  if (subcmd === "sell") {
    const itemName = args.slice(1).join(" ").toLowerCase();
    if (!itemName) {
      return sendMessage(senderId, { text: "⚠️ Usage: gagstockgame sell [item name]" }, pageAccessToken);
    }

    const item = items.find(i => i.name.toLowerCase() === itemName);
    if (!item) {
      return sendMessage(senderId, { text: "❌ Item not found!" }, pageAccessToken);
    }

    const data = getUserData(senderId);
    const userData = data.gagstockgame[senderId];
    const itemIndex = userData.inventory.findIndex(i => i.toLowerCase() === itemName);

    if (itemIndex === -1) {
      return sendMessage(senderId, { text: "❌ You don't have this item in your inventory!" }, pageAccessToken);
    }

    userData.inventory.splice(itemIndex, 1);
    userData.coins += item.sellPrice;
    userData.xp += 5;

    saveData(data);
    return sendMessage(senderId, {
      text: `✅ Sold ${item.emoji} ${item.name} for ${item.sellPrice} coins!\n💰 Coins: ${userData.coins}\n⭐ XP: ${userData.xp}/${userData.level * 100}`
    }, pageAccessToken);
  }

  if (subcmd === "inventory" || subcmd === "inv") {
    const data = getUserData(senderId);
    const userData = data.gagstockgame[senderId];

    if (userData.inventory.length === 0) {
      return sendMessage(senderId, { text: "📦 Your inventory is empty!" }, pageAccessToken);
    }

    const itemCount = {};
    userData.inventory.forEach(item => {
      itemCount[item] = (itemCount[item] || 0) + 1;
    });

    let invText = "📦 𝗬𝗼𝘂𝗿 𝗜𝗻𝘃𝗲𝗻𝘁𝗼𝗿𝘆\n\n";
    Object.entries(itemCount).forEach(([name, count]) => {
      const item = items.find(i => i.name === name);
      invText += `${item.emoji} ${name} x${count}\n`;
    });

    return sendMessage(senderId, { text: invText }, pageAccessToken);
  }

  if (subcmd === "profile" || subcmd === "stats") {
    const data = getUserData(senderId);
    const userData = data.gagstockgame[senderId];

    const profileText = `👤 𝗬𝗼𝘂𝗿 𝗣𝗿𝗼𝗳𝗶𝗹𝗲\n\n` +
                       `💰 Coins: ${userData.coins}\n` +
                       `⭐ Level: ${userData.level}\n` +
                       `📊 XP: ${userData.xp}/${userData.level * 100}\n` +
                       `📦 Items: ${userData.inventory.length}\n` +
                       `🕐 Last played: ${new Date(userData.lastPlayed).toLocaleString()}`;

    return sendMessage(senderId, { text: profileText }, pageAccessToken);
  }

  if (subcmd === "daily") {
    const data = getUserData(senderId);
    const userData = data.gagstockgame[senderId];
    const now = Date.now();
    const lastClaim = userData.lastDaily || 0;
    const dayInMs = 24 * 60 * 60 * 1000;

    if (now - lastClaim < dayInMs) {
      const timeLeft = dayInMs - (now - lastClaim);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      return sendMessage(senderId, {
        text: `⏰ Daily reward already claimed!\nCome back in ${hoursLeft} hours.`
      }, pageAccessToken);
    }

    const reward = 200 + (userData.level * 50);
    userData.coins += reward;
    userData.lastDaily = now;
    userData.xp += 20;

    saveData(data);
    return sendMessage(senderId, {
      text: `🎁 Daily reward claimed!\n💰 +${reward} coins\n⭐ +20 XP\n\nTotal coins: ${userData.coins}`
    }, pageAccessToken);
  }

  return sendMessage(senderId, {
    text: "❌ Invalid command! Use 'gagstockgame help' for available commands."
  }, pageAccessToken);
};
