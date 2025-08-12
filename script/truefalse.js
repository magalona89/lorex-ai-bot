module.exports.config = {
  name: "truefalse",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["tf"],
  description: "Answer a True or False question",
  usages: "truefalse",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const questions = [
    { q: "The capital of Japan is Tokyo.", a: "true" },
    { q: "There are 25 hours in a day.", a: "false" },
    { q: "Water boils at 100°C.", a: "true" },
    { q: "The sun revolves around the Earth.", a: "false" }
  ];

  const picked = questions[Math.floor(Math.random() * questions.length)];

  api.sendMessage(`🤔 True or False?\n\n${picked.q}\n\nReply with 'true' or 'false'.`, event.threadID, (err, info) => {
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

  const userAnswer = body.trim
