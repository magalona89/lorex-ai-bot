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
  version: '3.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['asknova', 'novaa', 'ai', 'image', 'feedback', 'kick'],
  description: "Ask Nova AI, generate/edit image, send feedback, or admin commands.",
  usages: "nova <prompt>\nnova feedback <message>\nnova kick (reply to user)\nnova maintenance on/off",
  credits: 'You',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply, senderID } = event;
  const isAdmin = senderID === ADMIN_UID;

  // Handle Maintenance Mode Toggle by Admin
  if (args[0]?.toLowerCase() === 'maintenance') {
    if (!isAdmin) return api.sendMessage("❌ Only the admin can toggle maintenance mode.", threadID, messageID);

    const mode = args[1]?.toLowerCase();
    if (mode === 'on') {
      MAINTENANCE_MODE = true;
      return api.sendMessage("🔧 Maintenance mode is now ON. Only admin can use Nova commands.", threadID, messageID);
    } else if (mode === 'off') {
      MAINTENANCE_MODE = false;
      return api.sendMessage("✅ Maintenance mode is now OFF. Everyone can use Nova again.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ Use `nova maintenance on` or `nova maintenance off`.", threadID, messageID);
    }
  }

  // Block access to commands during maintenance (except admin)
  if (MAINTENANCE_MODE && !isAdmin) {
    return api.sendMessage("🚧 Nova AI is under maintenance. Please try again later.", threadID, messageID);
  }

  // Handle Kick Command
  if (args[0]?.toLowerCase() === 'kick') {
    if (!isAdmin) {
      return api.sendMessage("❌ You don't have permission to use this command.", threadID, messageID);
    }
    if (!messageReply) {
      return api.sendMessage("❌ Reply to the user you want to kick with 'nova kick'.", threadID, messageID);
    }
    const userToKick = messageReply.senderID;
    try {
      await api.removeUserFromGroup(userToKick, threadID);
      return api.sendMessage(`✅ User has been kicked from the group.`, threadID, messageID);
    } catch (err) {
      console.error("Kick Error:", err);
      return api.sendMessage("❌ Failed to kick user. Make sure I have admin rights.", threadID, messageID);
    }
  }

  // Handle Feedback
  if (args[0]?.toLowerCase() === 'feedback') {
    const feedbackMsg = args.slice(1).join(" ");
    if (!feedbackMsg) {
      return api.sendMessage("❌ Provide a feedback message.\nExample: nova feedback This bot is amazing!", threadID, messageID);
    }
    try {
      await api.sendMessage(`📩 *Nova Feedback*\nFrom: ${senderID}\nThread: ${threadID}\n\nMessage:\n${feedbackMsg}`, ADMIN_UID);
      return api.sendMessage("✅ Your feedback has been sent to the admin. Thank you!", threadID, messageID);
    } catch (err) {
      return api.sendMessage("❌ Failed to send feedback. Try again later.", threadID, messageID);
    }
  }

  const input = args.join(" ");
  if (!input) {
    return api.sendMessage("❌ Please provide a prompt or command.", threadID, messageID);
  }

  // React to show processing
  api.setMessageReaction("⏳", messageID, () => {}, true);

  // IMAGE EDIT
  if (
    messageReply &&
    Array.isArray(messageReply.attachments) &&
    messageReply.attachments[0]?.type === "photo"
  ) {
    try {
      const res = await axios.get("https://gemini-edit-omega.vercel.app/edit", {
        params: {
          prompt: input,
          imgurl: messageReply.attachments[0].url
        }
      });

      if (!res.data?.images?.[0]) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ Image edit failed.", threadID, messageID);
      }

      const imageBuffer = Buffer.from(res.data.images[0].replace(/^data:image\/\w+;base64,/, ""), "base64");
      const cachePath = path.join(__dirname, "cache", `${Date.now()}_nova.png`);
      fs.ensureDirSync(path.dirname(cachePath));
      fs.writeFileSync(cachePath, imageBuffer);

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => fs.unlinkSync(cachePath), messageID);
    } catch (err) {
      console.error("Image Edit Error:", err.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("❌ Error editing image.", threadID, messageID);
    }
  }

  // TEXT MODE (Nova AI)
  const tempMsg = await new Promise(resolve => {
    api.sendMessage("⏳ Contacting Nova AI...", threadID, (err, info) => resolve(info));
  });

  try {
    const { data } = await axios.get("https://daikyu-apizer-108.up.railway.app/api/openai-gpt-5", {
      params: { ask: input, uid: senderID },
      timeout: 15000
    });

    let replyText = typeof data.result === 'string' ? data.result : (typeof data === 'string' ? data : JSON.stringify(data));
    replyText = replyText.replace(/\{.*?\}/gs, '').trim();

    const formatted = replyText
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t))
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))
      .replace(/###\s*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const opener = responseOpeners[Math.floor(Math.random() * responseOpeners.length)];
    return api.editMessage(`${opener}\n\n${formatted}`, tempMsg.messageID, threadID);

  } catch (err) {
    console.error("Nova AI Error:", err.message);
    return api.editMessage("⚠️ Failed to get response from Nova AI. Try again later.", tempMsg.messageID, threadID);
  }
};
