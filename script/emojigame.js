module.exports.config = {
  name: "emojigame",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["emoji"],
  description: "Match the emoji shown",
  usages: "emojigame",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const emojis = ["😀", "😎", "😡", "🐱", "🎉", "🚗", "🍕", "👻", "❤️", "🤖"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  api.sendMessage(`😜 Emoji Match!\n\nSend this emoji: ${randomEmoji}`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      emoji: randomEmoji,
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  if (body.trim() === handleReply.emoji) {
    api.sendMessage("✅ Correct emoji! 🥳", threadID, messageID);
  } else {
    api.sendMessage(`❌ Wrong emoji! It was: ${handleReply.emoji}`, threadID, messageID);
  }
};
