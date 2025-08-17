module.exports.config = {
  name: 'update',
  version: '1.0.0',
  hasPermission: 0, // Everyone can use
  usePrefix: false,
  aliases: ['changelog', 'updates', 'news'],
  description: "See all recent AI or bot updates",
  usages: "update",
  credits: 'OpenAI x You',
  cooldowns: 5
};

const updates = [
  {
    date: "2025-08-17",
    title: "🔁 Added `accept all` feature",
    description: "- Accept all pending friend requests using `accept all`.\n- Thread admin permission added."
  },
  {
    date: "2025-08-16",
    title: "🔒 Request Limit & Ban System",
    description: "- Users are limited to 3 requests.\n- Auto-ban for 4 hours after exceeding limit.\n- Prompt length limit enforced."
  },
  {
    date: "2025-08-15",
    title: "🤖 MESSANDRA (GPT-4o AI) Launched",
    description: "- Integrated OpenAI GPT-4o for advanced responses.\n- Image + prompt support via Gemini Vision."
  },
  {
    date: "2025-08-14",
    title: "📸 Image Vision Support",
    description: "- Users can now reply to images with prompts to get visual analysis."
  }
];

module.exports.run = async function({ api, event }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  let updateMsg = `📢 𝗔𝗜 / 𝗕𝗼𝘁 𝗨𝗽𝗱𝗮𝘁𝗲𝘀:\n━━━━━━━━━━━━━━━\n`;

  updates.forEach(update => {
    updateMsg += `🗓️ ${update.date}\n${update.title}\n${update.description}\n━━━━━━━━━━━━━━━\n`;
  });

  return api.sendMessage(updateMsg, threadID, messageID);
};
