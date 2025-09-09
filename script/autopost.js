const moduleName = "post";
const version = "2.0.5";
const author = "Prince";

module.exports.config = {
  name: moduleName,
  version,
  description: "Post a message or toggle auto-post love letters",
  usage: "post <message> | autopost on | autopost off",
  role: 0,
  author
};

let autoPostInterval = null;
let isAutoPosting = false;

// Function to generate a random love letter
function getRandomLoveLetter() {
  const senderName = "John";

  const greetings = [
    "Dear Beloved", "My Dearest", "Sweetheart",
    "Darling", "Love of My Life"
  ];
  const bodies = [
    "Every moment with you feels like a dream I never want to wake from. Your smile lights up my world, and I cherish every laugh we share.",
    "In the quiet of the night, I think of you and smile. Your love is my greatest treasure, warming my heart like the sun on a summer day.",
    "You are the melody to my song, the colors in my painting. I fall in love with you all over again every day.",
    "Distance means nothing when someone means everything. Your love inspires me to be better, to dream bigger.",
    "Holding your hand, I know what true happiness feels like. Thank you for being you.",
    "Your laughter is my favorite sound, and your touch is my greatest comfort. I am so grateful to have you.",
    "With you, every day is an adventure. Your kindness and strength make me want to be a better person.",
    "I love the way you see the world, and I love how you make me see it too. Forever grateful.",
    "You are my everything, my reason to smile, my reason to love. I can't imagine life without you.",
    "In your eyes, I see my future, my happiness, my forever. Thank you for loving me back."
  ];
  const closings = [
    "Forever yours", "With all my love", "Eternally", "Always", "Forever and always"
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const body = bodies[Math.floor(Math.random() * bodies.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return `${greeting},\n\n${body}\n\n${closing},\n${senderName}`;
}

// Main handler
module.exports.onStart = async function ({ api, event }) {
  const args = event.body.slice(5).trim().split(" ");
  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const message = args.slice(command === "autopost" ? 2 : 1).join(" ");
  const threadID = event.threadID;
  const replyToId = event.messageID;

  // Handle auto-post command
  if (command === "autopost") {
    if (subCommand === "on") {
      if (isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already ON!", threadID, replyToId);
      }

      isAutoPosting = true;
      autoPostInterval = setInterval(async () => {
        const loveLetter = getRandomLoveLetter();
        const phTime = new Date().toLocaleString("en-PH", {
          timeZone: "Asia/Manila"
        });

        const autoMessage = `💌 Love Letter:\n\n${loveLetter}\n\n🕒 Posted at: ${phTime}`;
        try {
          await api.createPost(autoMessage);
          // Optionally notify group here
        } catch (err) {
          console.error("❌ Auto-post failed:", err);
        }
      }, 360000); // every 6 minutes

      return api.sendMessage("✅ Auto-post love letters turned ON! Posting every 6 minutes.", threadID, replyToId);
    }

    if (subCommand === "off") {
      if (!isAutoPosting) {
        return api.sendMessage("⚠️ Auto-post is already OFF!", threadID, replyToId);
      }

      isAutoPosting = false;
      clearInterval(autoPostInterval);
      autoPostInterval = null;

      return api.sendMessage("❌ Auto-post love letters turned OFF.", threadID, replyToId);
    }

    return api.sendMessage("❓ Usage: post autopost on | autopost off", threadID, replyToId);
  }

  // Manual post
  if (!message) {
    return api.sendMessage("❗ Please enter a message to post.\nUsage: post <message>", threadID, replyToId);
  }

  try {
    const phTime = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila"
    });
    const postMessage = `${message}\n\n🕒 Posted at: ${phTime}`;

    await api.createPost(postMessage);
    api.sendMessage(`✅ Post successful!\n\n🕒 Time: ${phTime}`, threadID, replyToId);
  } catch (error) {
    const phTime = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila"
    });
    console.error("❌ Failed to create post:", error);
    api.sendMessage(`❌ Failed to post. Please try again!\n🕒 Time: ${phTime}`, threadID, replyToId);
  }
};
