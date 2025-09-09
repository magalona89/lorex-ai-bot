module.exports.config = {
  name: "lotto",
  version: "1.0.0",
  description: "Auto post lotto results every 1 hour",
  usage: "lotto autopost on | autopost off",
  role: 0,
  author: "ChatGPT",
};

let autoPostInterval = null;
let isAutoPosting = false;

// Function to generate random lotto result (6 numbers 1-49)
function generateLottoResult() {
  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 49) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

function generateReport() {
  const lottoNumbers = generateLottoResult();
  const phTime = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  return `🎰 Lotto Results 🎰\n\nNumbers: ${lottoNumbers.join(", ")}\n\n🕒 Draw Time: ${phTime} (Philippine Time)`;
}

module.exports.onStart = async function ({ api, event }) {
  const args = event.body.slice(6).trim().split(" ");
  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const threadID = event.threadID;
  const replyToId = event.messageID;

  if (command === "autopost") {
    if (subCommand === "on") {
      if (isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already ON!", threadID, replyToId);
      }

      isAutoPosting = true;
      autoPostInterval = setInterval(async () => {
        const report = generateReport();
        try {
          await api.createPost(report);
        } catch (err) {
          console.error("❌ Auto-post failed:", err);
        }
      }, 3600000); // every 1 hour

      return api.sendMessage(
        "✅ Auto-post lotto results turned ON! Posting every 1 hour.",
        threadID,
        replyToId
      );
    }

    if (subCommand === "off") {
      if (!isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already OFF!", threadID, replyToId);
      }

      isAutoPosting = false;
      clearInterval(autoPostInterval);
      autoPostInterval = null;

      return api.sendMessage("❌ Auto-post lotto results turned OFF.", threadID, replyToId);
    }

    return api.sendMessage("❓ Usage: lotto autopost on | autopost off", threadID, replyToId);
  }

  return api.sendMessage("❗ Invalid command. Usage:\nlotto autopost on | autopost off", threadID, replyToId);
};
