const { setStatus, getStatus } = require('./aria-maintenance');
const adminUID = "61580959514473";

module.exports.config = {
  name: 'ariacontrol',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['ariamaint', 'ariamode'],
  description: "Toggle Aria AI maintenance mode (Admin only)",
  usages: "ariacontrol [on/off]",
  credits: "ChatGPT Pro",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (uid !== adminUID) {
    return api.sendMessage("⛔ You are not authorized to manage Aria's maintenance.", threadID, messageID);
  }

  const action = args[0]?.toLowerCase();
  if (!["on", "off"].includes(action)) {
    return api.sendMessage("🔧 Usage: `ariacontrol on` (Enable maintenance)\n🔓 or: `ariacontrol off` (Disable maintenance)", threadID, messageID);
  }

  setStatus(action === "on");

  return api.sendMessage(
    action === "on"
      ? "🛠️ 𝗠𝗮𝗶𝗻𝘁𝗲𝗻𝗮𝗻𝗰𝗲 𝗠𝗼𝗱𝗲 𝗔𝗖𝗧𝗜𝗩𝗔𝗧𝗘𝗗\nOnly the admin can use Aria AI."
      : "✅ 𝗔𝗿𝗶𝗮 𝗔𝗜 𝗶𝘀 𝗕𝗔𝗖𝗞 𝗢𝗡𝗟𝗜𝗡𝗘\nAll users can access it now.",
    threadID,
    messageID
  );
};
