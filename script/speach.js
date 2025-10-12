const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "speak",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["say", "ttsai"],
  description: "Gumamit ng AI voice (OpenAI speech)",
  usages: "speak <text> | [voice] | [vibe]",
  credits: "urangkapolka API | Modified by ChatGPT",
  cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const input = args.join(" ").trim();

  if (!input) {
    return api.sendMessage(
      "❗𝗟𝗮𝗴𝗮𝘆 𝗮𝗻𝗴 𝘁𝗲𝗸𝘀𝘁𝗼 𝗻𝗮 𝗴𝘂𝘀𝘁𝗼 𝗺𝗼 𝗽𝗮𝗴𝘀𝗮𝗹𝗶𝘁𝗮𝗶𝗻.\n\nExample:\n`speak Hello world | nova | cheerful`",
      threadID,
      messageID
    );
  }

  // Parse: text | voice | vibe
  const [text, voice = "nova", vibe = "neutral"] = input.split("|").map(p => p.trim());

  if (!text) {
    return api.sendMessage("❗𝗠𝘂𝗹𝗮𝗻𝗴 𝘁𝗲𝗸𝘀𝘁𝗼 𝗻𝗮 𝗯𝗮𝗯𝗮𝘀𝗮𝗵𝗶𝗻.", threadID, messageID);
  }

  const url = `https://urangkapolka.vercel.app/api/openai-speech?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}&vibe=${encodeURIComponent(vibe)}`;

  const filePath = path.join(__dirname, "cache", `tts_${Date.now()}.mp3`);

  // Send loading message
  const loading = await new Promise((resolve) => {
    api.sendMessage("🔊 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝗮𝘂𝗱𝗶𝗼...", threadID, (err, info) => resolve(info));
  });

  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(res.data, "binary"));

    return api.sendMessage(
      {
        body: `🗣️ 𝗔𝗜 𝗩𝗼𝗶𝗰𝗲: ${voice} | 𝗩𝗶𝗯𝗲: ${vibe}`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      () => fs.unlinkSync(filePath)
    );
  } catch (err) {
    console.error("TTS Error:", err);
    return api.sendMessage("❌ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗴𝗲𝗻𝗲𝗿𝗮𝘁𝗲 𝗮𝘂𝗱𝗶𝗼.", threadID, messageID);
  }
};
