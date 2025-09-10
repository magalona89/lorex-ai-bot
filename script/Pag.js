const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "stock",
  version: "2.2",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["agg", "gagstock"],
  description: "Auto-post GagStock tracker every 3 minutes with user score, medals, and image attachments. Use 'on' or 'off' to toggle.",
  usages: "[on|off]",
  cooldowns: 0,
};

const usersScore = {};
const medals = [
  { score: 200, emoji: "🥇 Gold Medal" },
  { score: 100, emoji: "🥈 Silver Medal" },
  { score: 50, emoji: "🥉 Bronze Medal" },
];

const fruitsList = [
  { name: "🍎 Apple", price: 25 },
  { name: "🍌 Banana", price: 15 },
  { name: "🍊 Orange", price: 30 },
  { name: "🍉 Watermelon", price: 50 },
  { name: "🍇 Grapes", price: 40 },
  { name: "🥭 Mango", price: 35 },
  { name: "🍍 Pineapple", price: 45 },
  { name: "🍈 Melon", price: 20 },
  { name: "🍓 Strawberry", price: 60 },
];

const statuses = ["🌿 Fresh", "🍃 Ripe", "⚠️ Almost gone", "❌ Out of stock"];

const imageAttachmentUrl = "https://i.imgur.com/Bkb0kDB.jpeg";

let autoPostInterval = null;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getProgressBar(score, max = 200) {
  const totalBars = 20;
  const filledBars = Math.min(Math.floor((score / max) * totalBars), totalBars);
  const emptyBars = totalBars - filledBars;
  return "█".repeat(filledBars) + "░".repeat(emptyBars);
}

function getMedal(score) {
  for (const medal of medals) {
    if (score >= medal.score) return medal.emoji;
  }
  return "🏅";
}

function generateGagStockData() {
  const fruit = fruitsList[getRandomInt(0, fruitsList.length - 1)];
  const status = statuses[getRandomInt(0, statuses.length - 1)];
  const priceFluctuation = getRandomInt(-5, 5);
  const price = Math.max(fruit.price + priceFluctuation, 5);
  return { fruit: fruit.name, price, status };
}

function buildPostMessage(userName, fruitData, score) {
  const medal = getMedal(score);
  const progressBar = getProgressBar(score);

  return `
🌱 **GagStock Tracker Update**

🍉 Fruit: ${fruitData.fruit}
💰 Price: ₱${fruitData.price}
📊 Status: ${fruitData.status}

👤 Posted by: *${userName}*
🏆 Score: ${score} ${medal}
📈 Progress: \`${progressBar}\`

Keep growing your garden and collect more fruits! 🌿
`;
}

// --- Mock API functions ---

// Simulates creating a post and returns a fake URL
async function createPost({ body, attachment }) {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 1000));

  // Normally here you would call your real API to create a post and get URL
  // For demo, just return a fake post URL with a random ID
  const fakePostID = Math.floor(Math.random() * 1000000);
  return `https://facebook.com/fakepost/${fakePostID}`;
}

// Simulates sending a message in thread (e.g., group chat)
async function sendMessage(message, threadID) {
  console.log(`[SendMessage][Thread:${threadID}]: ${message}`);
  // Replace with actual api.sendMessage if available
}

async function postGagStockUpdate(api, threadID, userID, userName) {
  const fruitData = generateGagStockData();
  const gainPoints = getRandomInt(5, 15);
  usersScore[userID] = (usersScore[userID] || 0) + gainPoints;
  const score = usersScore[userID];

  const message = buildPostMessage(userName, fruitData, score);

  const attachment = {
    type: "photo",
    url: imageAttachmentUrl,
  };

  const postUrl = await api.createPost({
    body: message,
    attachment: attachment,
  });

  if (!postUrl) {
    await api.sendMessage(
      "⚠️ Post was created but no URL was returned by API.",
      threadID
    );
    return;
  }

  await api.sendMessage(
    `✅ GagStock update posted by *${userName}*!\n🔗 [Click here to view the post](${postUrl})`,
    threadID
  );

  if (score >= 200) {
    await api.sendMessage(
      `🎉 Congratulations *${userName}*! You've leveled up with a score of ${score} and earned the ${getMedal(score)}! Keep it up! 🏅`,
      threadID
    );
  }

  let topUserID = null;
  let topScore = 0;
  for (const uid in usersScore) {
    if (usersScore[uid] > topScore) {
      topUserID = uid;
      topScore = usersScore[uid];
    }
  }

  const topUserName = topUserID === userID ? userName : "Another User";

  await api.sendMessage(
    `🔥 Top User: *${topUserName}* with score: ${topScore} ${getMedal(topScore)}`,
    threadID
  );
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, senderName } = event;

  const action = (args[0] || "").toLowerCase();

  // Override api functions for demo, replace with real API calls
  api.createPost = createPost;
  api.sendMessage = sendMessage;

  if (action === "on") {
    if (autoPostInterval) {
      return api.sendMessage("⚠️ Auto GagStock posting is already running.", threadID);
    }

    api.sendMessage("✅ Auto GagStock posting started! Posting every 3 minutes...", threadID);

    autoPostInterval = setInterval(async () => {
      try {
        await postGagStockUpdate(api, threadID, senderID, senderName);
      } catch (e) {
        console.error("❌ Auto post error:", e);
        api.sendMessage("❌ An error occurred during auto-posting.", threadID);
      }
    }, 180000);

    return;
  }

  if (action === "off") {
    if (!autoPostInterval) {
      return api.sendMessage("⚠️ Auto posting is not running.", threadID);
    }

    clearInterval(autoPostInterval);
    autoPostInterval = null;
    return api.sendMessage("⏹️ Auto GagStock posting stopped.", threadID);
  }

  api.sendMessage(
    "⚠️ Invalid usage! Use:\n• autogagstock on — to start auto-post\n• autogagstock off — to stop auto-post",
    threadID
  );
};
