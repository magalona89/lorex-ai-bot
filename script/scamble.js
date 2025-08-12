module.exports.config = {
  name: "scramble",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["wordscramble"],
  description: "Unscramble the word!",
  usages: "scramble",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const words = ["apple", "banana", "giraffe", "computer", "laptop", "dragon", "school", "chatbot"];
  const word = words[Math.floor(Math.random() * words.length)];
  const scrambled = word.split('').sort(() => 0.5 - Math.random()).join('');

  api.sendMessage(`🧠 Unscramble this word: **${scrambled}**\n\nReply with your answer!`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: word,
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  const guess = body.trim().toLowerCase();
  if (guess === handleReply.answer.toLowerCase()) {
    api.sendMessage("✅ Correct! You unscrambled it! 🎉", threadID, messageID);
  } else {
    api.sendMessage(`❌ Nope! The correct word was: ${handleReply.answer}`, threadID, messageID);
  }
};
