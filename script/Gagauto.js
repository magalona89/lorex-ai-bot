module.exports.config = {
  name: "gag",
  version: "1.0.0",
  description: "Auto-post prices for fruits and vegetables",
  usage: "produce on/off",
  role: 0,
  author: "Prince"
};

let produceInterval = null;
let isAutoPostingProduce = false;

// Fruits and vegetables list with emojis
const produceList = [
  { name: "Banana", emoji: "🍌", min: 40, max: 55 },
  { name: "Apple", emoji: "🍎", min: 100, max: 140 },
  { name: "Mango", emoji: "🥭", min: 70, max: 100 },
  { name: "Orange", emoji: "🍊", min: 80, max: 120 },
  { name: "Pineapple", emoji: "🍍", min: 70, max: 90 },
  { name: "Papaya", emoji: "🍈", min: 40, max: 60 },
  { name: "Tomato", emoji: "🍅", min: 60, max: 90 },
  { name: "Potato", emoji: "🥔", min: 30, max: 50 },
  { name: "Carrot", emoji: "🥕", min: 50, max: 70 },
  { name: "Sweet Potato", emoji: "🍠", min: 30, max: 45 },
  { name: "Lettuce", emoji: "🥬", min: 40, max: 65 },
  { name: "Cabbage", emoji: "🥬", min: 35, max: 60 },
  { name: "Garlic", emoji: "🧄", min: 90, max: 130 },
  { name: "Onion", emoji: "🧅", min: 60, max: 90 },
  { name: "Corn", emoji: "🌽", min: 35, max: 50 },
  { name: "Grapes", emoji: "🍇", min: 120, max: 160 },
  { name: "Cucumber", emoji: "🥒", min: 40, max: 60 },
  { name: "Chili", emoji: "🌶️", min: 100, max: 150 },
  { name: "Watermelon", emoji: "🍉", min: 25, max: 40 }
];

// Helper to get random price in range
function getRandomPrice(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Format the message
function generateProduceMessage() {
  const now = new Date();
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timeString = phTime.toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  let message = "🥦 Fruits & Vegetables Price Tracker 🍎\n\n";

  produceList.forEach(item => {
    const price = getRandomPrice(item.min, item.max);
    message += `${item.emoji} ${item.name}: ₱${price}/kg\n`;
  });

  message += `\n📅 Updated: ${timeString}`;
  return message;
}

module.exports.onStart = async function ({ api, event }) {
  const args = event.body.trim().split(" ");
  const command = args[1]?.toLowerCase();
  const threadID = event.threadID;
  const replyID = event.messageID;

  if (command === "on") {
    if (isAutoPostingProduce) {
      return api.sendMessage("🟢 Produce auto-post is already ON.", threadID, replyID);
    }

    isAutoPostingProduce = true;

    produceInterval = setInterval(async () => {
      const message = generateProduceMessage();

      try {
        await api.createPost(message); // Post to FB
      } catch (err) {
        console.error("❌ Failed to auto-post produce prices:", err);
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return api.sendMessage("✅ Auto-posting fruits & vegetables prices every 10 minutes.", threadID, replyID);
  }

  if (command === "off") {
    if (!isAutoPostingProduce) {
      return api.sendMessage("⚠️ Produce auto-posting is already OFF.", threadID, replyID);
    }

    clearInterval(produceInterval);
    produceInterval = null;
    isAutoPostingProduce = false;

    return api.sendMessage("❌ Produce auto-posting turned OFF.", threadID, replyID);
  }

  return api.sendMessage("Usage: produce on | produce off", threadID, replyID);
};
