const fs = require('fs');

module.exports.config = {
  name: 'sendnoti',
  version: '1.0.0',
  hasPermission: 0, // ✅ Anyone can use
  usePrefix: true,
  aliases: ['broadcast', 'notif', 'sendall'],
  description: 'Send a custom notification to all chats',
  usages: 'sendnoti [message]',
  credits: 'Messandra Dev Team',
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const message = args.join(" ").trim();

  if (!message) {
    return api.sendMessage("❌ Please enter a message to send.\n\nUsage: sendnoti Hello everyone!", threadID, messageID);
  }

  const allThreads = await api.getThreadList(100, null, ["INBOX"]);
  let success = 0, fail = 0;

  api.sendMessage(`📨 Sending your message to ${allThreads.length} chats...`, threadID, messageID);

  for (const thread of allThreads) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay to prevent rate limiting
      await api.sendMessage(`📢 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗳𝗿𝗼𝗺 𝗨𝘀𝗲𝗿:\n\n${message}`, thread.threadID);
      success++;
    } catch (err) {
      console.error(`❌ Failed to send to ${thread.threadID}:`, err.message);
      fail++;
    }
  }

  return api.sendMessage(`✅ Notification completed!\n\n📬 Sent: ${success}\n❌ Failed: ${fail}`, threadID);
};
