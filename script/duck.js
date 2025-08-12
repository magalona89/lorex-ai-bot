const moment = require("moment-timezone");

// In-memory storage (replace with DB in production)
const loggedInUsers = new Set(); // senderIDs ng mga naka-login
const threadsReadyForFeedback = new Set(); // threadIDs ready for feedback
const activeGroupChats = new Set(); // lahat ng GC threadIDs na na-detect ng bot

const ADMIN_PASSWORD = "19876";  // password para mag-login (verify user)
const FEEDBACK_PASSWORD = "1976"; // password para mag-submit ng feedback

module.exports.config = {
  name: "feedback",
  version: "3.0.0",
  hasPermission: 0,
  usePrefix: true,
  aliases: ["report", "suggestion"],
  description: "Login with admin password before sending feedback with feedback password.",
  usages: "login <admin_password> OR feedback <feedback_password> <category> <message>",
  cooldowns: 10,
  dependencies: {
    "moment-timezone": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  // Auto add this thread to active GC list if group
  if (isGroup) activeGroupChats.add(threadID);

  // Admin-only command: set "done" for feedback in current thread
  if (args[0] === "done" && senderID.toString() === "61577040643519") {
    threadsReadyForFeedback.add(threadID);
    return api.sendMessage(
      "✅ This group thread is now marked as DONE. Members can start logging in and sending feedback.",
      threadID,
      messageID
    );
  }

  // LOGIN command
  if (args[0] === "login") {
    if (args.length < 2) {
      return api.sendMessage("❗ Usage: login <admin_password>", threadID, messageID);
    }
    const adminPass = args[1];
    if (adminPass === ADMIN_PASSWORD) {
      loggedInUsers.add(senderID);
      return api.sendMessage("✅ Login successful! You can now send feedback using the feedback password.", threadID, messageID);
    } else {
      return api.sendMessage("❌ Invalid admin password. Please try again.", threadID, messageID);
    }
  }

  // Check if thread is ready for feedback
  if (!threadsReadyForFeedback.has(threadID)) {
    return api.sendMessage(
      "⚠️ Feedback is not yet enabled in this group. Please wait for admin approval.",
      threadID,
      messageID
    );
  }

  // Check if user logged in
  if (!loggedInUsers.has(senderID)) {
    return api.sendMessage(
      "❗ You must login first before sending feedback.\n" +
      "Usage: login <admin_password>",
      threadID,
      messageID
    );
  }

  // Feedback command usage:
  if (args.length < 3) {
    return api.sendMessage(
      "❗ Usage: feedback <feedback_password> <category> <message>\n" +
      "Example: feedback 1976 bug May mali sa command",
      threadID,
      messageID
    );
  }

  const feedbackPass = args[0];
  if (feedbackPass !== FEEDBACK_PASSWORD) {
    return api.sendMessage("❌ Invalid feedback password. Please try again.", threadID, messageID);
  }

  const category = args[1].toLowerCase();
  const message = args.slice(2).join(" ");

  const allowedCategories = ["bug", "suggestion", "other"];
  const feedbackCategory = allowedCategories.includes(category) ? category : "unspecified";

  const timestamp = moment().tz("Asia/Manila").format("MMMM D, YYYY (dddd) — h:mm A");

  let userName = "Unknown";
  try {
    const userInfo = await api.getUserInfo(senderID);
    userName = userInfo[senderID]?.name || "Unknown";
  } catch (e) {
    console.warn("Could not fetch user name:", e.message);
  }

  // Prepare feedback message
  const fullMessage =
`╔═════════════════════╗
║   📩  𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞 𝗥𝗘𝗣𝗢𝗥𝗧   ║
╚═════════════════════╝
👤 Sender: ${userName} (${senderID})
📂 Category: ${feedbackCategory}
📅 Date/Time: ${timestamp}
📝 Message:
${message}

━━━━━━━━━━━━━━━━━━━━
🤖 𝙈𝙀𝙎𝙎𝘼𝙉𝘿𝙍𝘼 𝘼𝙄 𝙑5
🧠 𝙋𝙊𝙒𝙀𝙍𝙀𝘿 𝘽𝙔 𝘾𝙄𝙏𝙔 𝙊𝙁 𝘾𝘼𝙈𝘼𝙍𝙄𝙉𝙀𝙎 𝙎𝙐𝙍 𝙄𝙉𝙏𝙀𝙇𝙇𝙄𝙂𝙀𝙉𝘾𝙀 𝙈𝙀𝙎𝙎𝘼𝙉𝘿𝙍𝘼
`;

  // Define recipients (admin + all active GCs)
  const targetThreads = ["61577040643519", ...activeGroupChats];

  const replyRules =
"✅ Naipadala na ang iyong feedback sa admin at mga group chat!\n\n" +
"📜 𝗠𝗘𝗦𝗦𝗔𝗡𝗗𝗥𝗔 𝗔𝗜 𝗥𝗨𝗟𝗘𝗦 𝗙𝗘𝗘𝗗𝗕𝗔𝗖𝗞\n" +
"─────────────────────\n" +
"1. Maging magalang at malinaw sa iyong mensahe\n" +
"2. Huwag magsend ng spam o fake reports\n" +
"3. Maaring tumugon ang admin kung kinakailangan\n\n" +
"✅ Done accepting 𝗠𝗘𝗦𝗦𝗔𝗡𝗗𝗥𝗔 𝗔𝗜 𝗥𝗨𝗟𝗘𝗦\n" +
"Salamat sa pagtulong upang mapabuti ang sistema!";

  try {
    for (const tID of targetThreads) {
      await api.sendMessage(fullMessage, tID);
    }
    await api.sendMessage(replyRules, threadID, messageID);
  } catch (err) {
    console.error("❌ Error sending feedback:", err);
    return api.sendMessage("❌ May problema sa pagpapadala ng feedback. Subukan muli mamaya.", threadID, messageID);
  }
};
