const cron = require("node-cron");

module.exports.config = {
  name: "gagstock",
  version: "4.0",
  hasPermission: 0, // accessible by all users
  usePrefix: true,
  aliases: [],
  description: "Auto-post GagStock every 3 minutes with poster name, top score & level up",
  usages: "[on/off/score]",
  cooldowns: 0,
};

let gagstockTask = null;
let currentPoster = null;
let userScores = {}; // { userID: totalGainPoints }
let userLevels = {}; // track levels reached to avoid repeated level-up posts

const LEVEL_UP_THRESHOLD = 200;

const items = [
  { name: "Apple", emoji: "🍎", basePrice: 50 },
  { name: "Carrot", emoji: "🥕", basePrice: 30 },
  { name: "Banana", emoji: "🍌", basePrice: 25 },
  { name: "Tomato", emoji: "🍅", basePrice: 40 },
  { name: "Cabbage", emoji: "🥬", basePrice: 35 },
  { name: "Eggplant", emoji: "🍆", basePrice: 28 },
  { name: "Pineapple", emoji: "🍍", basePrice: 60 },
  { name: "Watermelon", emoji: "🍉", basePrice: 70 },
];

// Helper: generate stock data + total gain points for current run
function generateGagStockData() {
  let upCount = 0;
  let downCount = 0;
  let totalGainPoints = 0; // Sum of positive % changes

  const marketData = items.map(item => {
    const percentChange = Math.floor(Math.random() * 21) - 10; // -10% to +10%
    const newPrice = Math.max(5, Math.round(item.basePrice * (1 + percentChange / 100)));
    let trendIcon = "➖";
    if (percentChange > 0) {
      trendIcon = "📈";
      upCount++;
      totalGainPoints += percentChange;
    } else if (percentChange < 0) {
      trendIcon = "📉";
      downCount++;
    }

    return {
      ...item,
      price: newPrice,
      change: percentChange,
      trend: trendIcon,
    };
  });

  // Sort descending by absolute change
  const sorted = [...marketData].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Top gainer and loser
  const topGainer = sorted.find(i => i.change > 0);
  const topLoser = sorted.find(i => i.change < 0);

  const summaryTrend = upCount > downCount ? "🟢 Uptrend" :
                       downCount > upCount ? "🔴 Downtrend" : "🟤 Mixed";

  let message = `🌿 𝗚𝗮𝗴𝗦𝘁𝗼𝗰𝗸 𝗧𝗿𝗮𝗰𝗸𝗲𝗿 (Fruits & Vegetables)\n📊 Market Mood: ${summaryTrend}\n\n`;

  message += sorted.map(item =>
    `${item.emoji} ${item.name} – ₱${item.price}/kg – ${item.trend} ${item.change >= 0 ? "+" : ""}${item.change}%`
  ).join("\n");

  if (topGainer || topLoser) {
    message += `\n\n🏆 Top Gainer: ${topGainer ? `${topGainer.emoji} ${topGainer.name} (+${topGainer.change}%)` : "N/A"}`;
    message += `\n📉 Top Loser: ${topLoser ? `${topLoser.emoji} ${topLoser.name} (${topLoser.change}%)` : "N/A"}`;
  }

  return { message, totalGainPoints };
}

// Helper: format top score list message
function getTopScoresMessage() {
  const entries = Object.entries(userScores);
  if (entries.length === 0) return "No top scores yet.";

  // Sort descending by points
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  let msg = "🏅 𝗚𝗮𝗴𝗦𝘁𝗼𝗰𝗸 𝗧𝗼𝗽 𝗦𝗰𝗼𝗿𝗲𝗿𝘀:\n";
  for (let i = 0; i < Math.min(sorted.length, 5); i++) {
    const [userID, score] = sorted[i];
    msg += `${i + 1}. ${userID} — ${score.toFixed(1)} points\n`;
  }
  return msg;
}

// Helper: check for level up and return message or null
function checkLevelUp(userID) {
  const score = userScores[userID] || 0;
  const currentLevel = userLevels[userID] || 0;
  const newLevel = Math.floor(score / LEVEL_UP_THRESHOLD);

  if (newLevel > currentLevel) {
    userLevels[userID] = newLevel;
    return `🏅 Congratulations! <@${userID}> has leveled up to **Level ${newLevel}** with ${score.toFixed(1)} points! 🎉🥳`;
  }
  return null;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const command = args[0]?.toLowerCase();

  if (!["on", "off", "score"].includes(command)) {
    return api.sendMessage(
      "📌 Usage:\n/gagstock on - Start auto-posting\n/gagstock off - Stop auto-posting\n/gagstock score - Show top scorers",
      threadID,
      messageID
    );
  }

  if (command === "on") {
    if (gagstockTask) {
      return api.sendMessage("⚠️ GagStock is already running.", threadID, messageID);
    }

    currentPoster = senderID;

    api.sendMessage("✅ GagStock auto-posting started! Updates every 3 minutes.", threadID, messageID);

    gagstockTask = cron.schedule("*/3 * * * *", async () => {
      const { message, totalGainPoints } = generateGagStockData();

      // Update user score for current poster
      if (currentPoster) {
        if (!userScores[currentPoster]) userScores[currentPoster] = 0;
        userScores[currentPoster] += totalGainPoints;

        // Check for level up message
        const levelUpMsg = checkLevelUp(currentPoster);

        try {
          const userInfo = await api.getUserInfo(currentPoster);
          const name = userInfo?.[currentPoster]?.name || "Unknown";

          const finalMessage = `${message}\n\n👤 Posted by: ${name}`;

          await api.sendMessage(finalMessage, threadID);

          if (levelUpMsg) {
            await api.sendMessage(levelUpMsg, threadID);
          }
        } catch (e) {
          // fallback
          await api.sendMessage(`${message}\n\n👤 Posted by: Unknown`, threadID);

          if (levelUpMsg) {
            await api.sendMessage(levelUpMsg, threadID);
          }
        }
      }
    });

  } else if (command === "off") {
    if (!gagstockTask) {
      return api.sendMessage("⚠️ GagStock is not running.", threadID, messageID);
    }

    gagstockTask.stop();
    gagstockTask = null;
    currentPoster = null;

    return api.sendMessage("🛑 GagStock auto-posting stopped.", threadID, messageID);
  } else if (command === "score") {
    const topScoresMessage = getTopScoresMessage();
    return api.sendMessage(topScoresMessage, threadID, messageID);
  }
};
