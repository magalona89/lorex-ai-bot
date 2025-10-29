
const fs = require('fs-extra');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'dailybonus.json');

async function loadData() {
  try {
    await fs.ensureDir(path.dirname(DATA_PATH));
    if (!await fs.pathExists(DATA_PATH)) {
      await fs.writeFile(DATA_PATH, JSON.stringify({}, null, 2));
    }
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function getUserData(data, userId) {
  if (!data[userId]) {
    data[userId] = {
      money: 0,
      lastClaim: 0,
      streak: 0,
      totalClaimed: 0,
      level: 1,
      xp: 0,
      inventory: [],
      achievements: [],
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0
      }
    };
  }
  return data[userId];
}

module.exports.config = {
  name: "dailybonus",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["daily", "claim", "bonus"],
  description: "Claim your daily bonus and manage your account",
  usages: "dailybonus | dailybonus stats | dailybonus leaderboard",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const subcmd = args[0]?.toLowerCase();

  const data = await loadData();
  const user = getUserData(data, senderID);

  if (!subcmd || subcmd === "claim") {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeSinceLastClaim = now - user.lastClaim;

    if (timeSinceLastClaim < dayInMs) {
      const timeLeft = dayInMs - timeSinceLastClaim;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      return api.sendMessage(
        `⏰ Daily Bonus Already Claimed!\n\n` +
        `Come back in: ${hoursLeft}h ${minutesLeft}m\n` +
        `💰 Current Balance: ${user.money.toLocaleString()}\n` +
        `🔥 Current Streak: ${user.streak} days`,
        threadID, messageID
      );
    }

    // Check streak
    if (timeSinceLastClaim < dayInMs * 2) {
      user.streak++;
    } else {
      user.streak = 1;
    }

    // Calculate bonus based on streak
    let baseBonus = 500;
    let streakBonus = Math.min(user.streak * 100, 2000);
    let levelBonus = user.level * 50;
    let totalBonus = baseBonus + streakBonus + levelBonus;

    user.money += totalBonus;
    user.lastClaim = now;
    user.totalClaimed += totalBonus;
    user.xp += 100;
    user.stats.totalEarnings += totalBonus;

    // Level up check
    let xpNeeded = user.level * 1000;
    let leveledUp = false;
    while (user.xp >= xpNeeded) {
      user.level++;
      user.xp -= xpNeeded;
      xpNeeded = user.level * 1000;
      leveledUp = true;
    }

    await saveData(data);

    let msg = `🎁 Daily Bonus Claimed!\n\n`;
    msg += `💰 Base Bonus: +${baseBonus.toLocaleString()}\n`;
    msg += `🔥 Streak Bonus (${user.streak} days): +${streakBonus.toLocaleString()}\n`;
    msg += `📊 Level Bonus (Lv.${user.level}): +${levelBonus.toLocaleString()}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `✨ Total Earned: +${totalBonus.toLocaleString()}\n`;
    msg += `💵 New Balance: ${user.money.toLocaleString()}\n`;
    msg += `⭐ XP: ${user.xp}/${user.level * 1000}\n`;
    
    if (leveledUp) {
      msg += `\n🎉 LEVEL UP! You're now Level ${user.level}!`;
    }

    return api.sendMessage(msg, threadID, messageID);
  }

  if (subcmd === "stats" || subcmd === "profile") {
    let msg = `👤 Your Profile\n\n`;
    msg += `💰 Money: ${user.money.toLocaleString()}\n`;
    msg += `📊 Level: ${user.level}\n`;
    msg += `⭐ XP: ${user.xp}/${user.level * 1000}\n`;
    msg += `🔥 Streak: ${user.streak} days\n`;
    msg += `💵 Total Claimed: ${user.totalClaimed.toLocaleString()}\n`;
    msg += `🎮 Games Played: ${user.stats.gamesPlayed}\n`;
    msg += `🏆 Games Won: ${user.stats.gamesWon}\n`;
    msg += `📈 Total Earnings: ${user.stats.totalEarnings.toLocaleString()}\n`;
    msg += `🎒 Inventory Items: ${user.inventory.length}\n`;
    msg += `🏅 Achievements: ${user.achievements.length}`;

    return api.sendMessage(msg, threadID, messageID);
  }

  if (subcmd === "leaderboard" || subcmd === "top") {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return api.sendMessage("No players yet!", threadID, messageID);
    }

    const sorted = entries.sort((a, b) => b[1].money - a[1].money);
    let msg = `🏆 Top 10 Richest Players\n\n`;

    for (let i = 0; i < Math.min(10, sorted.length); i++) {
      const [userId, userData] = sorted[i];
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      msg += `${medal} ${userId}: ${userData.money.toLocaleString()}\n`;
    }

    return api.sendMessage(msg, threadID, messageID);
  }

  return api.sendMessage(
    `📋 Daily Bonus Commands:\n\n` +
    `• dailybonus - Claim daily bonus\n` +
    `• dailybonus stats - View your profile\n` +
    `• dailybonus leaderboard - View top players`,
    threadID, messageID
  );
};

module.exports.updateStats = async function(userId, statsUpdate) {
  const data = await loadData();
  const user = getUserData(data, userId);
  
  if (statsUpdate.gamesPlayed) user.stats.gamesPlayed += statsUpdate.gamesPlayed;
  if (statsUpdate.gamesWon) user.stats.gamesWon += statsUpdate.gamesWon;
  if (statsUpdate.earnings) {
    user.money += statsUpdate.earnings;
    user.stats.totalEarnings += statsUpdate.earnings;
  }
  if (statsUpdate.xp) {
    user.xp += statsUpdate.xp;
    let xpNeeded = user.level * 1000;
    while (user.xp >= xpNeeded) {
      user.level++;
      user.xp -= xpNeeded;
      xpNeeded = user.level * 1000;
    }
  }
  
  await saveData(data);
  return user;
};
