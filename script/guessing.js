module.exports.config = {
  name: "guesssong",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["lyricgame"],
  description: "Guess the song from the lyric",
  usages: "guesssong",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const songs = [
    { lyric: "Cause baby you're a firework...", answer: "firework" },
    { lyric: "I'm on the edge of glory...", answer: "edge of glory" },
    { lyric: "Is it too late now to say sorry?", answer: "sorry" },
    { lyric: "Hello from the other side...", answer: "hello" },
    { lyric: "Let it go, let it go...", answer: "let it go" }
  ];

  const picked = songs[Math.floor(Math.random() * songs.length)];

  api.sendMessage(`🎵 Guess the Song:\n\n🎶 "${picked.lyric}"\n\nReply with your answer!`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: picked.answer.toLowerCase(),
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const userAnswer = event.body.trim().toLowerCase();

  if (userAnswer === handleReply.answer) {
    api.sendMessage("✅ Correct! 🎉 You're good at this!", event.threadID, event.messageID);
  } else {
    api.sendMessage(`❌ Oops! The correct answer was: ${handleReply.answer}`, event.threadID, event.messageID);
  }
};
