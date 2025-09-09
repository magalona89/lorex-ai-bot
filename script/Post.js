const { setInterval, clearInterval } = require("timers");

module.exports.config = {
  name: "post",
  version: "2.1.0", // New version with autoshare
  description: "Post a message or toggle auto-post/share love letters",
  usage: "post <message> | autopost on/off | autoshare on/off",
  role: 0,
  author: "Prince",
};

let autoPostInterval = null;
let isAutoPosting = false;

let autoShareInterval = null;
let isAutoSharing = false;

// Dummy list of external posts to simulate sharing
const externalPosts = [
  "Check this inspiring story: https://fb.com/example1",
  "Don't miss this great read: https://fb.com/example2",
  "Something to warm your heart today ❤️: https://fb.com/example3",
  "A beautiful message I came across: https://fb.com/example4",
];

// Generates a random love letter
function getRandomLoveLetter() {
  const senderName = "John";

  const greetings = ["Dear Beloved", "My Dearest", "Sweetheart", "Darling", "Love of My Life"];
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
    "In your eyes, I see my future, my happiness, my forever. Thank you for loving me back.",
  ];
  const closings = ["Forever yours", "With all my love", "Eternally", "Always", "Forever and always"];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const body = bodies[Math.floor(Math.random() * bodies.length)];
  const closing = closings[Math.floor(Math.random() * closings.length)];

  return `${greeting},\n\n${body}\n\n${closing},\n${senderName}`;
}

module.exports.onStart = async function ({ api, event }) {
  const args = event.body.slice(5).trim().split(" ");
  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const message = args.slice(1).join(" ");
  const replyToId = event.messageID;

  const now = new Date();
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timeString = phTime.toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  // --- AUTOSHARE ---
  if (command === "autoshare") {
    if (subCommand === "on") {
      if (isAutoSharing) {
        return api.sendMessage("🔁 Auto-share is already ON!", event.threadID, replyToId);
      }

      isAutoSharing = true;
      autoShareInterval = setInterval(async () => {
        const randomPost = externalPosts[Math.floor(Math.random() * externalPosts.length)];
        const shareMessage = `🔁 Shared Post:\n\n${randomPost}\n\nShared at: ${timeString}`;

        try {
          await api.createPost(shareMessage);
        } catch (error) {
          console.error("❌ Auto-share failed:", error);
        }
      }, 10 * 60 * 1000); // Every 10 minutes

      return api.sendMessage("✅ Auto-share turned ON! Sharing every 10 minutes.", event.threadID, replyToId);
    }

    if (subCommand === "off") {
      if (!isAutoSharing) {
        return api.sendMessage("🔕 Auto-share is already OFF.", event.threadID, replyToId);
      }

      isAutoSharing = false;
      clearInterval(autoShareInterval);
      autoShareInterval = null;

      return api.sendMessage("❌ Auto-share turned OFF.", event.threadID, replyToId);
    }

    return api.sendMessage("Usage: autoshare on | autoshare off", event.threadID, replyToId);
  }

  // --- AUTOPOST ---
  if (command === "autopost") {
    if (subCommand === "on") {
      if (isAutoPosting) {
        return api.sendMessage("Auto-post is already ON!", event.threadID, replyToId);
      }

      isAutoPosting = true;
      autoPostInterval = setInterval(async () => {
        const loveLetter = getRandomLoveLetter();
        const updatedTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
        });

        const autoMessage = `💌 Love Letter:\n\n${loveLetter}\n\nPosted at: ${updatedTime}`;
        try {
          await api.createPost(autoMessage);
        } catch (error) {
          console.error("Auto-post failed:", error);
        }
      }, 6 * 60 * 1000); // Every 6 minutes

      return api.sendMessage("✅ Auto-post love letters turned ON!", event.threadID, replyToId);
    }

    if (subCommand === "off") {
      if (!isAutoPosting) {
        return api.sendMessage("Auto-post is already OFF!", event.threadID, replyToId);
      }

      isAutoPosting = false;
      clearInterval(autoPostInterval);
      autoPostInterval = null;

      return api.sendMessage("❌ Auto-post love letters turned OFF.", event.threadID, replyToId);
    }

    return api.sendMessage("Usage: autopost on | autopost off", event.threadID, replyToId);
  }

  // --- MANUAL POST ---
  if (!message) {
    return api.sendMessage("⚠️ Please enter a message to post.", event.threadID, replyToId);
  }

  try {
    const messageWithTime = `${message}\n\nPosted at: ${timeString}`;
    await api.createPost(messageWithTime);
    return api.sendMessage(`✅ Post successful!\n\nTime: ${timeString}`, event.threadID, replyToId);
  } catch (error) {
    console.error("Manual post failed:", error);
    return api.sendMessage(`❌ Failed to post. Try again!\n\nTime: ${timeString}`, event.threadID, replyToId);
  }
};
