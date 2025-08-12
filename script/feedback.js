const userStates = new Map();

module.exports.config = {
  name: "feedback",
  version: "1.0.6",
  hasPermission: 0,
  usePrefix: true,
  aliases: [],
  description: "Send feedback with TOS, confirmation, and fallback to groups",
  usages: "feedback [your message]",
  cooldowns: 5,
};

const TERMS_OF_SERVICE = `
📜 𝙏𝙀𝙍𝙈𝙎 𝙊𝙁 𝙎𝙀𝙍𝙑𝙄𝘾𝙀

By submitting feedback, you agree that your message is respectful, legal, and does not contain harmful content.
The feedback may be used to improve the bot services.

Please type "AGREE" to accept these terms or "CANCEL" to abort.
`;

const GROUP_CHAT_IDS = [ // Put here your group chat thread IDs (strings or numbers)
  "1234567890123456",
  "2345678901234567",
  // add more group thread IDs
];

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, senderName } = event;

  if (!args.length && !userStates.has(senderID)) {
    return api.sendMessage("❌ Please provide your feedback message.", threadID, messageID);
  }

  const state = userStates.get(senderID);

  if (!state) {
    // Start TOS acceptance
    const feedbackMessage = args.join(" ");
    userStates.set(senderID, { step: "awaiting_tos", feedbackMessage });
    return api.sendMessage(TERMS_OF_SERVICE, threadID, messageID);
  }

  const userReply = args.join(" ").toLowerCase();

  if (state.step === "awaiting_tos") {
    if (userReply === "agree") {
      userStates.set(senderID, { step: "awaiting_confirmation", feedbackMessage: state.feedbackMessage });
      return api.sendMessage(
        `❓ You are about to send the following feedback:\n\n"${state.feedbackMessage}"\n\nReply 'yes' to confirm or 'no' to cancel.`,
        threadID,
        messageID
      );
    } else if (userReply === "cancel") {
      userStates.delete(senderID);
      return api.sendMessage("❌ Feedback process cancelled.", threadID, messageID);
    } else {
      return api.sendMessage(`⚠️ Please reply with "AGREE" or "CANCEL".`, threadID, messageID);
    }
  }

  if (state.step === "awaiting_confirmation") {
    if (userReply === "yes" || userReply === "y") {
      const phTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Manila",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const adminID = "YOUR_ADMIN_NUMERIC_FB_ID"; // replace with admin numeric ID

      const boxedMessage = [
        "╔════════════════════════════════════════╗",
        "║  𝙈𝙀𝙎𝙎𝘼𝙉𝘿𝙍𝘼 𝘼𝙄 𝙑5 𝙐𝙇𝙏𝙄𝙈𝘼𝙏𝙀 𝙄𝙉𝙏𝙀𝙇𝙇𝙄𝙂𝙀𝙉𝘾𝙀       ║",
        "╠════════════════════════════════════════╣",
        `║  🕒 Time: ${phTime}                     ║`,
        "╠════════════════════════════════════════╣",
        `║ From: ${senderName} (ID: ${senderID})`,
        "╠════════════════════════════════════════╣",
        "║ Feedback Message:                       ║",
        `║ ${state.feedbackMessage}`,
        "╠════════════════════════════════════════╣",
        "║           𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝙂𝙋𝙏-4                 ║",
        "╚════════════════════════════════════════╝",
      ].join("\n");

      try {
        await api.sendMessage(boxedMessage, adminID);
        userStates.delete(senderID);
        return api.sendMessage("✅ Your feedback has been sent to the admin. Thank you!", threadID, messageID);
      } catch (err) {
        console.error("Failed to send feedback to admin, sending to groups...", err);

        // fallback: send to groups
        for (const groupID of GROUP_CHAT_IDS) {
          try {
            await api.sendMessage(`[Fallback] Feedback from ${senderName} (ID: ${senderID}):\n\n${state.feedbackMessage}`, groupID);
          } catch (groupErr) {
            console.error(`Failed to send fallback feedback to group ${groupID}:`, groupErr);
          }
        }
        userStates.delete(senderID);
        return api.sendMessage("⚠️ Could not send to admin, your feedback was sent to the groups instead.", threadID, messageID);
      }
    } else if (userReply === "no" || userReply === "n") {
      userStates.delete(senderID);
      return api.sendMessage("❌ Feedback cancelled.", threadID, messageID);
    } else {
      return api.sendMessage(`⚠️ Please reply with 'yes' or 'no' to confirm your feedback.`, threadID, messageID);
    }
  }
};
