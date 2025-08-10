module.exports.config = {
  name: 'autosendnoti',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['sendnoti', 'noti', 'reminder'],
  description: "Automatically send scheduled notifications to all group chats depending on PH time",
  usages: "",
  credits: 'LorexAi',
  cooldowns: 0
};

const fs = require('fs');
const path = require('path');

const TIMEZONE = 'Asia/Manila';

// Scheduled messages keyed by "HH:mm" 24-hour format PH time
const scheduledMessages = {
  "09:00": "☀️ Good morning! Ready na ba kayo sa araw na ito?",
  "12:00": "🍽️ Don't forget to lunch! Take a break and eat well.",
  "15:00": "☕ Time for a coffee break! Refresh yourself.",
  "18:00": "🌇 Evening reminder: Wrap up your tasks for the day!",
};

const dataPath = path.join(__dirname, 'lastSentDates.json');

function getCurrentPHTime() {
  return new Date().toLocaleTimeString('en-PH', {
    timeZone: TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getCurrentPHDate() {
  return new Date().toLocaleDateString('en-PH', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function loadLastSentDates() {
  if (!fs.existsSync(dataPath)) return {};
  try {
    const raw = fs.readFileSync(dataPath);
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLastSentDates(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.run = async function({ api }) {
  try {
    const nowTime = getCurrentPHTime();   // e.g. "12:00"
    const todayDate = getCurrentPHDate(); // e.g. "2025-08-10"
    const lastSentDates = loadLastSentDates();

    // Check if there's a message scheduled for this time and not sent yet today
    if (scheduledMessages[nowTime] && lastSentDates[nowTime] !== todayDate) {
      const message = scheduledMessages[nowTime] + `\n\n━━━━━━━━━━━━━━━━━━━\n✨ THIS AI SUPPORTIVE BY LOREX ✨\n━━━━━━━━━━━━━━━━━━━`;

      // Get all group chats
      const allThreads = await api.getThreadList(100, null, ['OTHER']);
      const groupChats = allThreads.filter(thread => thread.isGroup);

      for (const group of groupChats) {
        await api.sendMessage(message, group.threadID);
        console.log(`Sent scheduled message at ${nowTime} to group ${group.threadID}`);
      }

      // Mark message as sent for today
      lastSentDates[nowTime] = todayDate;
      saveLastSentDates(lastSentDates);
    }
  } catch (error) {
    console.error('Error sending scheduled notification:', error);
  }
};
