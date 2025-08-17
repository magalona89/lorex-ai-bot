module.exports.config = {
  name: "feedback",
  version: "2.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["fb", "report"],
  description: "Send feedback or bug reports to the bot owner. If owner is unreachable, forwards to group chats.",
  usages: "feedback [your message]",
  credits: "ChatGPT + Lorex",
  cooldowns: 0
};

function formatBoxMessage(userName, uid, content) {
  const message = `👤 𝗙𝗲𝗲𝗱𝗯𝗮𝗰𝗸 𝗳𝗿𝗼𝗺: ${userName} (UID: ${uid})\n\n${content}\n\n𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙁𝙀𝙀𝘿𝘽𝘼𝘾𝙆 𝙎𝙔𝙎𝙏𝙀𝙈`;
  return `╔════════════════════════════════════╗\n` +
         message.split('\n').map(line => `║ ${line}`).join('\n') + '\n' +
         `╚════════════════════════════════════╝`;
}

module.exports.run = async function({ api, event, args }) {
  const content = args.join(" ");
  const { senderID, threadID, messageID } = event;

  if (!content) {
    return api.sendMessage("✏️ Please type your feedback.\n\nExample:\nfeedback This bot is cool!", threadID, messageID);
  }

  // Change to your actual admin UID
  const adminID = "100012345678901"; // <- Replace with your own Facebook UID

  // Optional group fallback map per threadID
  const fallbackGroups = {
    "1234567890123456": "9876543210987654", // if feedback from thread A fails to reach owner, send to group B
    "1122334455667788": "2233445566778899"  // Add more as needed
  };

  api.getUserInfo(senderID, async (err, info) => {
    if (err) return api.sendMessage("❌ Failed to get user info.", threadID, messageID);
    
    const userName = info[senderID]?.name || "User";
    const boxed = formatBoxMessage(userName, senderID, content);

    // Try sending to owner
    api.sendMessage(boxed, adminID, (error) => {
      if (error) {
        // Fallback to group based on threadID
        const fallbackGroup = fallbackGroups[threadID];

        if (fallbackGroup) {
          api.sendMessage(boxed, fallbackGroup, (err2) => {
            if (err2) {
              return api.sendMessage("⚠️ Failed to send feedback to admin and fallback group.", threadID, messageID);
            } else {
              return api.sendMessage("✅ Feedback sent to a support group (admin unreachable).", threadID, messageID);
            }
          });
        } else {
          return api.sendMessage("⚠️ Admin unreachable and no fallback group available for this chat.", threadID, messageID);
        }
      } else {
        // Sent successfully to admin
        return api.sendMessage("✅ Thank you! Your feedback was sent to the admin.", threadID, messageID);
      }
    });
  });
};
