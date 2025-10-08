const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ADMIN_UID = '61580959514473';
let MAINTENANCE_MODE = false;

function convertToBold(text) {
  const boldMap = {
    a:'𝗮', b:'𝗯', c:'𝗰', d:'𝗱', e:'𝗲', f:'𝗳', g:'𝗴', h:'𝗵', i:'𝗶', j:'𝗷',
    k:'𝗸', l:'𝗹', m:'𝗺', n:'𝗻', o:'𝗼', p:'𝗽', q:'𝗾', r:'𝗿', s:'𝘀', t:'𝘁',
    u:'𝘂', v:'𝘃', w:'𝘄', x:'𝘅', y:'𝘆', z:'𝘇',
    A:'𝗔', B:'𝗕', C:'𝗖', D:'𝗗', E:'𝗘', F:'𝗙', G:'𝗚', H:'𝗛', I:'𝗜', J:'𝗝',
    K:'𝗞', L:'𝗟', M:'𝗠', N:'𝗡', O:'𝗢', P:'𝗣', Q:'𝗤', R:'𝗥', S:'𝗦', T:'𝗧',
    U:'𝗨', V:'𝗩', W:'𝗪', X:'𝗫', Y:'𝗬', Z:'𝗭'
  };
  return text.split('').map(ch => boldMap[ch] || ch).join('');
}

const responseOpeners = [
  "✨ 𝗡𝗢𝗩𝗔 𝗔𝗜 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘",
  "🤖 𝗡𝗼𝘃𝗮 𝗵𝗮𝘀 𝗿𝗲𝗽𝗹𝗶𝗲𝗱!",
  "💡 𝗡𝗼𝘃𝗮 𝗦𝗮𝘆𝘀:"
];

module.exports.config = {
  name: 'nova',
  version: '2.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['asknova', 'novaa', 'ai', 'image', 'feedback'],
  description: "Ask Nova AI, generate/edit image, or send feedback.",
  usages: "nova <prompt> (reply to image for image edit)\nnova feedback <message>",
  credits: 'You',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply, senderID } = event;
  if (args.length === 0) {
    return api.sendMessage("❌ Please provide a prompt or use 'nova feedback <message>'.", threadID, messageID);
  }

  // Handle feedback command: nova feedback <message>
  if (args[0].toLowerCase() === 'feedback') {
    const feedbackMsg = args.slice(1).join(" ");
    if (!feedbackMsg) {
      return api.sendMessage("❌ Please provide a message to send as feedback.\nExample: nova feedback I love this AI!", threadID, messageID);
    }

    // Send feedback directly to admin UID
    try {
      await api.sendMessage(
        `📩 *Nova Feedback*\nFrom: ${senderID}\nThread: ${threadID}\n\nMessage:\n${feedbackMsg}`,
        ADMIN_UID
      );
      return api.sendMessage("✅ Your feedback has been sent to the admin. Thank you!", threadID, messageID);
    } catch (err) {
      console.error("Nova Feedback Error:", err);
      return api.sendMessage("❌ Failed to send feedback. Please try again later.", threadID, messageID);
    }
  }

  // Maintenance mode check
  if (MAINTENANCE_MODE && senderID !== ADMIN_UID) {
    return api.sendMessage("🚧 Nova AI is currently under maintenance.\nPlease try again later.", threadID);
  }

  const input = args.join(" ");

  if (!input) {
    return api.sendMessage("❌ Please provide a prompt.\n\nExample: nova What is quantum computing?\nOr: reply to an image and say: nova make it look vintage", threadID, messageID);
  }

  // Reacting to show processing
  api.setMessageReaction("⏳", messageID, () => {}, true);

  // IMAGE MODE: If replying to an image
  if (
    messageReply &&
    Array.isArray(messageReply.attachments) &&
    messageReply.attachments[0]?.type === "photo"
  ) {
    const apiurl = "https://gemini-edit-omega.vercel.app/edit";
    const params = {
      prompt: input,
      imgurl: messageReply.attachments[0].url
    };

    try {
      const res = await axios.get(apiurl, { params });

      if (!res.data || !res.data.images || !res.data.images[0]) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Failed to generate or edit image.", threadID, messageID);
      }

      const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Image, "base64");

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);

      const imagePath = path.join(cacheDir, `${Date.now()}_nova.png`);
      fs.writeFileSync(imagePath, imageBuffer);

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage({
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        fs.unlinkSync(imagePath);
      }, messageID);

    } catch (err) {
      console.error("Nova Image Error:", err.response?.data || err.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Error generating/editing image. Try again later.", threadID, messageID);
    }
  }

  // TEXT MODE: Regular Nova AI response
  const tempMsg = await new Promise((resolve) => {
    api.sendMessage("⏳ Contacting Nova AI...", threadID, (err, info) => {
      resolve(info);
    });
  });

  try {
    const { data } = await axios.get("https://arychauhann.onrender.com/api/gpt5", {
      params: {
        prompt: input,
        uid: senderID,
        reset: 'reset'
      },
      timeout: 15000
    });

    let text = data.response || data.answer || (typeof data === "string" ? data : JSON.stringify(data));

    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const suggestions = [
      "Can you provide some examples of the types of information you can provide?",
      "What topics are you most knowledgeable about?",
      "How do you find information?",
      "Are you able to answer questions in multiple languages?"
    ];

    const followUp = `\n\n❓ *So, what's on your mind? Try asking:*\n` +
      suggestions.map(q => `▫️ ${q}`).join('\n');

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];

    return api.editMessage(`${opener}\n\n${formatted}${followUp}`, tempMsg.messageID, threadID);

  } catch (err) {
    console.error("Nova Text Error:", err);
    const errMsg = err.code === 'ECONNABORTED'
      ? "⚠️ Nova AI took too long to respond."
      : "⚠️ Error while retrieving response from Nova AI.";
    return api.editMessage(errMsg, tempMsg.messageID, threadID);
  }
};
