const axios = require("axios");

module.exports.config = {
  name: "bible",
  version: "3.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["bible", "verse", "biblia"],
  description: "Maghanap ng mga bersikulo o makatanggap ng Daily Verse (Tagalog Version).",
  usages: "probible [Aklat Kabanata:Berso]\nHalimbawa: probible Juan 3:16",
  credits: "Powered by ARIA AI",
  cooldowns: 0,
  dependencies: { axios: "" },
};

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ").trim();
  const dailyVerses = [
    "Juan 3:16",
    "Awit 23:1",
    "Filipos 4:13",
    "Roma 8:28",
    "Mateo 5:9",
    "Jeremias 29:11",
    "Kawikaan 3:5",
    "Isaias 41:10",
    "Awit 46:1",
    "Efeso 6:11"
  ];

  // Random verse kung walang query
  const chosenVerse = query || dailyVerses[Math.floor(Math.random() * dailyVerses.length)];
  const formattedQuery = chosenVerse.replace(/\s+/g, "+");
  const url = `https://bible-api.com/${formattedQuery}?translation=tcb`; // Tagalog Contemporary Bible

  // Kung walang input, sabihin na "Daily Verse"
  const header = query
    ? "📖 𝗣𝗥𝗢 𝗕𝗜𝗕𝗟𝗘 — 𝗧𝗔𝗚𝗔𝗟𝗢𝗚 𝗘𝗗𝗜𝗧𝗜𝗢𝗡"
    : "🌅 𝗩𝗘𝗥𝗦𝗘 𝗢𝗙 𝗧𝗛𝗘 𝗗𝗔𝗬 — 𝗣𝗥𝗢 𝗕𝗜𝗕𝗟𝗘";

  api.sendMessage("⏳ 𝗞𝗶𝗻𝘂𝗸𝘂𝗵𝗮 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼...", event.threadID, event.messageID);

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (!data.text) {
      return api.sendMessage(
        "⚠️ 𝗛𝗶𝗻𝗱𝗶 𝗺𝗮𝗵𝗮𝗻𝗮𝗽 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼. 𝗣𝗮𝗸𝗶-𝘀𝘂𝗿𝗶𝗶𝗻𝗴 𝗺𝗮𝗯𝘂𝘁𝗶 𝗮𝗻𝗴 𝗶𝗻𝗶𝗽𝘂𝘁.",
        event.threadID,
        event.messageID
      );
    }

    const message = [
      `${header}`,
      "━━━━━━━━━━━━━━━━━━",
      `📖 𝗕𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼: ${data.reference}`,
      "",
      `🕊️ ${data.text.trim()}`,
      "",
      `📚 𝗦𝗮𝗹𝗶𝗻: ${data.translation_name || "Tagalog Contemporary Bible"} (${(data.translation_id || "TCB").toUpperCase()})`,
      "",
      "📝 𝗧𝗔𝗟𝗔: Ang bawat bersikulo ay paalala ng pag-ibig, pag-asa, at biyaya ng Diyos. " +
      "Gamitin ito bilang inspirasyon at lakas sa iyong araw-araw na buhay.",
      "",
      "🤍 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗔𝗥𝗜𝗔 𝗔𝗜"
    ].join("\n");

    api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error("Bible API Error:", error.message);
    api.sendMessage(
      "🚫 𝗠𝗮𝘆 𝗻𝗮𝗴𝗮𝗻𝗮𝗽 𝗻𝗮 𝗲𝗿𝗿𝗼𝗿 𝗵𝗮𝗯𝗮𝗻𝗴 𝗸𝗶𝗻𝘂𝗸𝘂𝗵𝗮 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼. 𝗦𝘂𝗯𝘂𝗸𝗮𝗻 𝗺𝘂𝗹𝗶 𝗺𝗮𝗺𝗮𝘆𝗮.",
      event.threadID,
      event.messageID
    );
  }
};
