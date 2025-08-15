const fs = require('fs-extra');
const path = require('path');

// ======== PATH ========
const dataDir = path.join(__dirname, 'gardens');
fs.ensureDirSync(dataDir);

// ======== SHOP ITEMS ========
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
  orange: { emoji: "🍊", price: 35 },

  broccoli: { emoji: "🥦", price: 50 },
  eggplant: { emoji: "🍆", price: 55 },
  strawberry: { emoji: "🍓", price: 65 },
  cherry: { emoji: "🍒", price: 70 },
  purplecabbage: { emoji: "🥬", price: 80, premium: true },
  lemon: { emoji: "🍋", price: 40 },
  pinktulips: { emoji: "🌷", price: 75, premium: true },
  lotus: { emoji: "🌸", price: 85 },
  megamushroom: { emoji: "🍄", price: 95, premium: true },
  succulent: { emoji: "🪴", price: 100 },

  shovel: { emoji: "🛠️", price: 150 },
  wateringcan: { emoji: "💧", price: 120 },

  hat: { emoji: "🎩", price: 200 },
  glasses: { emoji: "🕶️", price: 180 }
};

// ======== GROW STAGES ========
const growStages = [
  "🟫 Soil is ready...",
  "🌱 Seed is planted...",
  "💧 Watering...",
  "🌿 A sprout appears!",
  "🌼 It's growing leaves...",
  "🌸 It's blooming!",
  "🌻 Your plant is fully grown!"
];

// ======== ADMIN IDS ========
const admins = ["61575940656891"];
const isAdmin = (id) => admins.includes(id);

// ======== HELPER FUNCTIONS ========
async function loadUserData(userID) {
  const file = path.join(dataDir, `${userID}.json`);
  if (await fs.pathExists(file)) {
    let data = await fs.readJson(file);
    data.inventory ??= {};
    data.gearStock ??= {};
    data.cosmetics ??= {};
    data.plant ??= null;
    data.coins ??= 100;
    data.premium ??= false;
    data.lastClaim ??= 0;
    data.totalEarned ??= 0;
    return data;
  }
  // Default new user data
  return {
    coins: 100,
    inventory: {},
    gearStock: {},
    cosmetics: {},
    plant: null,
    premium: false,
    lastClaim: 0,
    totalEarned: 0
  };
}

async function saveUserData(userID, data) {
  const file = path.join(dataDir, `${userID}.json`);
  await fs.writeJson(file, data);
}

// ======== MAIN MODULE ========
module.exports.config = {
  name: "putikgarden",
  version: "3.2.0",
  hasPermission: 0,
  description: "Garden game with seeds, gear, cosmetics, premium, and admin commands",
  usages: "putikgarden <command> [args]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID } = event;
  const cmd = args[0]?.toLowerCase();
  const garden = await loadUserData(senderID);

  // ====== UTIL: Check premium for premium-only items ======
  const canUse = (item) => {
    if (!item) return false;
    if (item.premium && !garden.premium) return false;
    return true;
  };

  // ====== CLAIM 60K daily ======
  if (cmd === "claim") {
    const now = Date.now();
    if (now - garden.lastClaim < 86400000) // 24 hours cooldown
      return api.sendMessage("⏳ You can only claim once every 24 hours.", threadID);
    garden.coins += 60000;
    garden.lastClaim = now;
    garden.totalEarned += 60000;
    await saveUserData(senderID, garden);
    return api.sendMessage("🎉 You claimed 60,000 coins!", threadID);
  }

  // ====== SHOP ======
  if (cmd === "shop") {
    let msg = "🛒 Garden Shop Items:\n";
    for (const [name, item] of Object.entries(shopItems)) {
      if (item.premium && !garden.premium) continue;
      msg += `${item.emoji} ${name} — 💰 ${item.price}\n`;
    }
    if (!garden.premium)
      msg += "\n💎 Unlock premium seeds with: putikgarden premium (cost: 200 coins)";
    return api.sendMessage(msg, threadID);
  }

  // ====== BUY ======
  if (cmd === "buy") {
    const itemName = args[1]?.toLowerCase();
    if (!itemName || !shopItems[itemName])
      return api.sendMessage("❌ Invalid item name. Use putikgarden shop", threadID);

    const item = shopItems[itemName];
    if (!canUse(item)) return api.sendMessage("❌ This item is premium-only.", threadID);
    if (garden.coins < item.price) return api.sendMessage("❌ Not enough coins.", threadID);

    garden.coins -= item.price;
    if (["shovel", "wateringcan", "hat", "glasses"].includes(itemName)) {
      garden.gearStock[itemName] = (garden.gearStock[itemName] || 0) + 1;
    } else if (["hat", "glasses"].includes(itemName)) {
      garden.cosmetics[itemName] = (garden.cosmetics[itemName] || 0) + 1;
    } else {
      garden.inventory[itemName] = (garden.inventory[itemName] || 0) + 1;
    }
    await saveUserData(senderID, garden);
    return api.sendMessage(`✅ Bought 1 ${item.emoji} ${itemName}`, threadID);
  }

  // ====== INVENTORY ======
  if (cmd === "inventory") {
    let msg = `📦 Your inventory:\nCoins: ${garden.coins}\n`;

    msg += "\n🍓 Fruits & Seeds:\n";
    if (Object.keys(garden.inventory).length === 0) msg += "None\n";
    else {
      for (const [key, val] of Object.entries(garden.inventory)) {
        msg += `${shopItems[key]?.emoji || "❓"} ${key}: ${val}\n`;
      }
    }

    msg += "\n🛠️ Gear Stock:\n";
    if (Object.keys(garden.gearStock).length === 0) msg += "None\n";
    else {
      for (const [key, val] of Object.entries(garden.gearStock)) {
        msg += `${shopItems[key]?.emoji || "❓"} ${key}: ${val}\n`;
      }
    }

    msg += "\n🎨 Cosmetics Stock:\n";
    if (Object.keys(garden.cosmetics).length === 0) msg += "None\n";
    else {
      for (const [key, val] of Object.entries(garden.cosmetics)) {
        msg += `${shopItems[key]?.emoji || "❓"} ${key}: ${val}\n`;
      }
    }

    return api.sendMessage(msg, threadID);
  }

  // ====== PLANT ======
  if (cmd === "plant") {
    const seed = args[1]?.toLowerCase();
    if (!seed) return api.sendMessage("❌ Specify what to plant. Usage: putikgarden plant <seed>", threadID);

    if (!garden.inventory[seed] || garden.inventory[seed] <= 0)
      return api.sendMessage(`❌ You don't own any ${seed}`, threadID);

    const item = shopItems[seed];
    if (!item || !canUse(item)) return api.sendMessage("❌ Invalid or premium seed.", threadID);

    garden.inventory[seed]--;
    garden.plant = { name: seed, stage: 0 };
    await saveUserData(senderID, garden);
    return api.sendMessage(`🌱 You planted ${item.emoji} ${seed}`, threadID);
  }

  // ====== GROW ======
  if (cmd === "grow") {
    if (!garden.plant) return api.sendMessage("❌ You haven't planted anything yet.", threadID);

    if (garden.plant.stage >= growStages.length - 1)
      return api.sendMessage("🌻 Your plant is fully grown! Use putikgarden harvest", threadID);

    garden.plant.stage++;
    await saveUserData(senderID, garden);

    return api.sendMessage(`${shopItems[garden.plant.name]?.emoji || "🌿"} ${garden.plant.name}: ${growStages[garden.plant.stage]}`, threadID);
  }

  // ====== HARVEST ======
  if (cmd === "harvest") {
    if (!garden.plant) return api.sendMessage("❌ You haven't planted anything yet.", threadID);
    if (garden.plant.stage < growStages.length - 1)
      return api.sendMessage("🌱 Your plant is not fully grown yet! Use putikgarden grow", threadID);

    // Reward: random coins 80-150
    const reward = Math.floor(Math.random() * 71) + 80;
    garden.coins += reward;
    garden.totalEarned += reward;

    const harvestedPlant = garden.plant.name;
    garden.plant = null;
    await saveUserData(senderID, garden);

    return api.sendMessage(`🎉 You harvested ${shopItems[harvestedPlant]?.emoji || "🌿"} ${harvestedPlant} and earned ${reward} coins!`, threadID);
  }

  // ====== PREMIUM ======
  if (cmd === "premium") {
    if (garden.premium)
      return api.sendMessage("💎 You already have Garden Premium!", threadID);
    if (garden.coins < 200)
      return api.sendMessage("❌ You need 200 coins to buy Garden Premium.", threadID);

    garden.coins -= 200;
    garden.premium = true;
    await saveUserData(senderID, garden);
    return api.sendMessage("✅ You unlocked Garden Premium! Enjoy premium seeds!", threadID);
  }

  // ====== ADMIN COMMANDS ======
  if (isAdmin(senderID)) {
    // giveallseeds: Give all seeds to user or self
    if (cmd === "giveallseeds") {
      const targetID = args[1] || senderID;
      const targetData = await loadUserData(targetID);

      for (const [name, item] of Object.entries(shopItems)) {
        if (item.premium && !targetData.premium) continue;
        if (!["shovel", "wateringcan", "hat", "glasses"].includes(name)) {
          targetData.inventory[name] = (targetData.inventory[name] || 0) + 3;
        }
      }
      await saveUserData(targetID, targetData);
      return api.sendMessage(`✅ Given all seeds x3 to user ${targetID}`, threadID);
    }

    // givegear: Give gear item to user or self
    if (cmd === "givegear") {
      const gearName = args[1];
      const targetID = args[2] || senderID;
      if (!gearName || !shopItems[gearName] || !["shovel", "wateringcan", "hat",
