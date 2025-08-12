module.exports.config = {
  name: "mathgame",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["mathquiz", "math"],
  description: "Solve a random math challenge",
  usages: "mathgame",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const operator = ["+", "-", "*"][Math.floor(Math.random() * 3)];
  const expression = `${a} ${operator} ${b}`;
  const answer = eval(expression);

  api.sendMessage(`🧮 Math Challenge:\nWhat is ${expression}?`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer,
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  const guess = parseInt(body);
  if (guess === handleReply.answer) {
    api.sendMessage("✅ Correct! You're good at math! 💡", threadID, messageID);
  } else {
    api.sendMessage(`❌ Nope! The correct answer was: ${handleReply.answer}`, threadID, messageID);
  }
};
