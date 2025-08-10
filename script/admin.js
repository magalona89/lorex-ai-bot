module.exports.config = {
  name: 'admincheck',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['checkadmin'],
  description: "Check if you are the One and Only Super Poge admin",
  usages: "admincheck",
  credits: 'LorexAi',
  cooldowns: 5
};

const TIMEZONE = 'Asia/Manila';
const SUPER_POGE_ID = '61577040643519';

function getCurrentPHTime() {
  return new Date().toLocaleString('en-PH', {
    timeZone: TIMEZONE,
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

module.exports.run = async function({ api, event }) {
  const senderID = event.senderID.toString();
  const nowPH = getCurrentPHTime();

  if (senderID === SUPER_POGE_ID) {
    return api.sendMessage(
      `👑 Hello Super Poge Admin! 👑\n\n` +
      `Current Philippine time: ${nowPH}\n\n` +
      `You have full admin access. Keep being awesome! 💪✨\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ THIS AI SUPPORTIVE BY LOREX ✨\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
      event.threadID,
      event.messageID
    );
  } else {
    return api.sendMessage(
      `❌ Sorry, you are not the One and Only Super Poge admin.\n\n` +
      `Current Philippine time: ${nowPH}\n\n` +
      `If you think this is a mistake, contact the admin.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ THIS AI SUPPORTIVE BY LOREX ✨\n` +
      `━━━━━━━━━━━━━━━━━━━━`,
      event.threadID,
      event.messageID
    );
  }
};
