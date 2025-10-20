module.exports.config = {
  name: "update",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["bible-update", "aria-update", "biblever"],
  description: "Ipakita ang lahat ng update at changelog ng ARIA AI Pro Bible.",
  usages: "bible update",
  credits: "Powered by ARIA AI ✨",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event }) {

  const message = [
    "📖 *ARIA AI — PRO BIBLE UPDATES*",
    "━━━━━━━━━━━━━━━━━━━",
    "",
    "🆕 *Version 2.0.0* — (Oktubre 2025)",
    "🔹 Bagong Tagalog Translation (TLB)",
    "🔹 Mas maayos at eleganteng format ng talata",
    "🔹 Nadagdag ang 'Notes' section para sa pagninilay",
    "🔹 Simple 'How to Use' guide para sa mga bagong user",
    "🔹 ARIA Branding at mas magandang message layout",
    "",
    "⚙️ *Version 1.1.0* — (Agosto 2025)",
    "🔸 Mas magandang error handling",
    "🔸 Mas mabilis na pagkuha ng Bible verse gamit ang API",
    "🔸 Pinaganda ang mensahe gamit ang emojis at spacing",
    "",
    "📘 *Version 1.0.0* — (Unang Release)",
    "🔸 Basic Bible verse fetcher",
    "🔸 English translation only",
    "🔸 Simple formatting",
    "",
    "💡 *Upcoming Features:*",
    "🔹 Verse of the Day (Random Daily Verse)",
    "🔹 Auto devotional notes generator",
    "🔹 Share verse as image with background",
    "",
    "✨ *Powered by ARIA AI — Bringing Faith and Technology Together.*",
    "━━━━━━━━━━━━━━━━━━━",
    "📅 *Last Updated:* Oktubre 2025"
  ].join("\n");

  return api.sendMessage(message, event.threadID, event.messageID);
};
