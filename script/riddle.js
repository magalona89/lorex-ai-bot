module.exports.config = {
  name: "riddle",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["bugtong", "puzzle"],
  description: "Answer a fun riddle!",
  usages: "riddle",
  credits: "OpenAI x You",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const riddles = [
    { q: "I speak without a mouth and hear without ears. What am I?", a: "echo" },
    { q: "What has keys but can't open locks?", a: "piano" },
    { q: "What can travel around the world while staying in one spot?", a: "stamp" },
    { q: "The more of me you take, the more you leave behind. What am I?", a: "footsteps" }
  ];

  const picked = riddles[Math.floor(Math.random() * riddles.length)];

  api.sendMessage(`🧠 Riddle Me This:\n\n${picked.q}`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: picked.a.toLowerCase(),
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  if (body.trim().toLowerCase() === handleReply.answer) {
    api.sendMessage("✅ Correct! You're clever! 🧠", threadID, messageID);
  } else {
    api.sendMessage(`❌ Wrong! The answer was: ${handleReply.answer}`, threadID, messageID);
  }
};
