const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "probible",
  version: "7.0.0",
  hasPermission: 2,
  usePrefix: false,
  aliases: ["bible", "verse", "biblia"],
  description: "Magpadala ng Tagalog Bible verses with auto ON/OFF, greetings, at logging.",
  usages: "probible [on/off] o probible [Aklat Kabanata:Berso]",
  credits: "Powered by ARIA AI",
  cooldowns: 0,
  dependencies: { axios: "", fs: "" },
};

// Para sa auto notify tracking
const activeGroups = new Map();

// Random daily verses
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

// Random greeting messages
const greetings = [
  "🌞 Magandang araw! Heto ang iyong Bible verse ngayon 💖",
  "🌅 Pagpalain ka ng Diyos! Basahin ang talatang ito 🙏",
  "💫 Inspirasyon mula sa Biblia para sa iyong araw ✨",
  "🌻 Panibagong araw, panibagong biyaya! Basahin ito 📖",
  "🕊️ Narito ang Salita ng Diyos upang gabayan ka 💌"
];

// Function para kumuha ng random verse
async function getVerse() {
  const randomVerse = dailyVerses[Math.floor(Math.random() * dailyVerses.length)];
  const url = `https://bible-api.com/${randomVerse}?translation=tcb`;

  try {
    const res = await axios.get(url);
    const data = res.data;
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

    const message = [
      greeting,
      "",
      "🌿 𝗣𝗥𝗢 𝗕𝗜𝗕𝗟𝗘 — 𝗧𝗔𝗚𝗔𝗟𝗢𝗚 𝗘𝗗𝗜𝗧𝗜𝗢𝗡",
      "━━━━━━━━━━━━━━━━━━",
      `📖 𝗕𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼: ${data.reference}`,
      "",
      `🕊️ ${data.text.trim()}`,
      "",
      `📚 𝗦𝗮𝗹𝗶𝗻: ${data.translation_name || "Tagalog Contemporary Bible"} (${(data.translation_id || "TCB").toUpperCase()})`,
      "",
      "📝 𝗧𝗔𝗟𝗔: Ang bawat bersikulo ay paalala ng pag-ibig at biyaya ng Diyos. " +
      "Maging inspirasyon ito sa iyong araw-araw na buhay.",
      "",
      "🤍 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗔𝗥𝗜𝗔 𝗔𝗜"
    ].join("\n");

    // 🧾 Logging
    const logEntry = `[${timestamp}] Sent verse: ${data.reference} — ${data.translation_name}\n`;
    fs.appendFileSync("bible_log.txt", logEntry, "utf8");

    return message;

  } catch (error) {
    return "⚠️ 𝗛𝗶𝗻𝗱𝗶 𝗺𝗮𝗸𝘂𝗵𝗮 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼 𝘀𝗮 𝗻𝗴𝗮𝘆𝗼𝗻. 𝗦𝘂𝗯𝘂𝗸𝗮𝗻 𝗺𝘂𝗹𝗶 𝗺𝗮𝗺𝗮𝘆𝗮.";
  }
}

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(" ").trim().toLowerCase();
  const threadID = event.threadID;

  // 🔹 OFF Command
  if (query === "off") {
    if (activeGroups.has(threadID)) {
      clearInterval(activeGroups.get(threadID).interval);
      clearTimeout(activeGroups.get(threadID).timeout);
      activeGroups.delete(threadID);
      return api.sendMessage("🛑 𝗔𝘂𝘁𝗼 𝗕𝗶𝗯𝗹𝗲 𝗡𝗼𝘁𝗶𝗳𝘆 𝗼𝗳𝗳 𝗻𝗮 𝘀𝗮 𝗴𝗿𝗼𝘂𝗽 𝗻𝗮 𝗶𝘁𝗼.", threadID, event.messageID);
    } else {
      return api.sendMessage("⚠️ 𝗪𝗮𝗹𝗮 𝗽𝗮 𝗮𝗸𝘁𝗶𝗯𝗼𝗻𝗴 𝗮𝘂𝘁𝗼 𝗻𝗼𝘁𝗶𝗳𝘆 𝗱𝗶𝘁𝗼.", threadID, event.messageID);
    }
  }

  // 🔹 ON Command
  if (query === "on") {
    if (activeGroups.has(threadID)) {
      return api.sendMessage("⚠️ 𝗔𝗰𝘁𝗶𝘃𝗲 𝗻𝗮 𝗮𝗻𝗴 𝗔𝘂𝘁𝗼 𝗕𝗶𝗯𝗹𝗲 𝗡𝗼𝘁𝗶𝗳𝘆 𝗱𝗶𝘁𝗼.", threadID, event.messageID);
    }

    api.sendMessage("✅ 𝗔𝘂𝘁𝗼 𝗕𝗶𝗯𝗹𝗲 𝗡𝗼𝘁𝗶𝗳𝘆 𝗢𝗡 — 𝗺𝗮𝗴𝗽𝗮𝗱𝗮𝗹𝗮 𝗯𝗮𝘄𝗮𝘁 𝟮 𝗺𝗶𝗻𝘂𝘁𝗲𝘀 𝗮𝘁 𝗮𝘂𝘁𝗼 𝗼𝗳𝗳 𝗮𝗳𝘁𝗲𝗿 𝟭𝟭 𝗺𝗶𝗻𝘂𝘁𝗲𝘀.", threadID);

    const interval = setInterval(async () => {
      const verseMsg = await getVerse();
      api.sendMessage(verseMsg, threadID);
    }, 2 * 60 * 1000); // every 2 mins

    const timeout = setTimeout(() => {
      clearInterval(interval);
      activeGroups.delete(threadID);
      api.sendMessage("⏰ 𝗔𝘂𝘁𝗼 𝗕𝗶𝗯𝗹𝗲 𝗡𝗼𝘁𝗶𝗳𝘆 𝗻𝗮𝗵𝗶𝗻𝘁𝗼 𝗻𝗮 𝗽𝗮𝗴𝗸𝗮𝘁𝗮𝗽𝗼𝘀 𝗻𝗴 𝟭𝟭 𝗺𝗶𝗻𝘂𝘁𝗲𝘀.", threadID);
    }, 11 * 60 * 1000);

    activeGroups.set(threadID, { interval, timeout });
    return;
  }

  // 🔹 Manual Verse
  if (query) {
    const formatted = query.replace(/\s+/g, "+");
    const url = `https://bible-api.com/${formatted}?translation=tcb`;

    api.sendMessage("⏳ 𝗞𝗶𝗻𝘂𝗸𝘂𝗵𝗮 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼...", threadID, event.messageID);
    try {
      const res = await axios.get(url);
      const data = res.data;
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      const timestamp = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

      const message = [
        greeting,
        "",
        "🌿 𝗣𝗥𝗢 𝗕𝗜𝗕𝗟𝗘 — 𝗧𝗔𝗚𝗔𝗟𝗢𝗚 𝗘𝗗𝗜𝗧𝗜𝗢𝗡",
        "━━━━━━━━━━━━━━━━━━",
        `📖 𝗕𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼: ${data.reference}`,
        "",
        `🕊️ ${data.text.trim()}`,
        "",
        `📚 𝗦𝗮𝗹𝗶𝗻: ${data.translation_name || "Tagalog Contemporary Bible"} (${(data.translation_id || "TCB").toUpperCase()})`,
        "",
        "📝 𝗧𝗔𝗟𝗔: Ang Salita ng Diyos ay nagbibigay ng pag-asa at lakas sa bawat isa sa atin.",
        "",
        "🤍 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗔𝗥𝗜𝗔 𝗔𝗜"
      ].join("\n");

      // Logging ng manual verse
      const logEntry = `[${timestamp}] Manual verse requested: ${data.reference}\n`;
      fs.appendFileSync("bible_log.txt", logEntry, "utf8");

      api.sendMessage(message, threadID, event.messageID);
    } catch {
      api.sendMessage("🚫 𝗛𝗶𝗻𝗱𝗶 𝗺𝗮𝗸𝘂𝗵𝗮 𝗮𝗻𝗴 𝗯𝗲𝗿𝘀𝗶𝗸𝘂𝗹𝗼.", threadID, event.messageID);
    }
    return;
  }

  // 🔹 Help Message
  api.sendMessage(
    "📖 𝗣𝗔𝗚𝗚𝗔𝗠𝗜𝗧 𝗡𝗚 𝗣𝗥𝗢 𝗕𝗜𝗕𝗟𝗘\n\n" +
    "🔹 probible on  → auto verse notify every 2 minutes (auto off after 11 mins)\n" +
    "🔹 probible off → stop auto verse\n" +
    "🔹 probible Juan 3:16 → hanapin ang partikular na bersikulo\n\n" +
    "📜 Lahat ng verse activity ay naka-log sa `bible_log.txt`\n" +
    "🤍 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗔𝗥𝗜𝗔 𝗔𝗜",
    threadID, event.messageID
  );
};
