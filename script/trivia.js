module.exports.config = {
  name: "trivia",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["quiz"],
  description: "Answer trivia questions!",
  usages: "trivia",
  credits: "OpenAI x You",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const questions = [
    {
      q: "What is the capital of France?",
      a: "paris"
    },
    {
      q: "Which planet is known as the Red Planet?",
      a: "mars"
    },
    {
      q: "What is 5 + 7?",
      a: "12"
    },
    {
      q: "What language is primarily spoken in Brazil?",
      a: "portuguese"
    },
    {
      q: "Who wrote 'Romeo and Juliet'?",
      a: "shakespeare"
    }
  ];

  const picked = questions[Math.floor(Math.random() * questions.length)];

  api.sendMessage(`❓ Trivia Time!\n\n${picked.q}\n\nReply with your answer:`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: picked.a,
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  if (body.trim().toLowerCase() === handleReply.answer.toLowerCase()) {
    api.sendMessage("✅ Correct! You're smart! 🧠", threadID, messageID);
  } else {
    api.sendMessage(`❌ Incorrect! The right answer was: ${handleReply.answer}`, threadID, messageID);
  }
};
