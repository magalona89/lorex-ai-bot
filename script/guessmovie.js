module.exports.config = {
  name: "guessmovie",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["emojimovie"],
  description: "Guess the movie from emojis!",
  usages: "guessmovie",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const questions = [
    { emoji: "🧑‍🚀🌕", answer: "interstellar" },
    { emoji: "🧞‍♂️🕌", answer: "aladdin" },
    { emoji: "🕷️🧑", answer: "spiderman" },
    { emoji: "🧊🚢", answer: "titanic" },
    { emoji: "🦁👑", answer: "lion king" }
  ];

  const picked = questions[Math.floor(Math.random() * questions.length)];

  api.sendMessage(`🎬 Guess the Movie from Emojis:\n\n${picked.emoji}\n\nReply with your answer.`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: picked.answer.toLowerCase(),
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const userAnswer = event.body.trim().toLowerCase();
  if (event.senderID !== handleReply.author) return;

  if (userAnswer === handleReply.answer) {
    api.sendMessage("✅ Correct! Nice one! 🎥", event.threadID, event.messageID);
  } else {
    api.sendMessage(`❌ Wrong. The correct answer was: ${handleReply.answer}`, event.threadID, event.messageID);
  }
};
