module.exports.config = {
  name: "rps",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["rockpaperscissors", "rock", "paper", "scissors"],
  description: "Play Rock Paper Scissors with the bot",
  usages: "rps",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  api.sendMessage("🪨📄✂️ Let's play Rock Paper Scissors!\n\nReply with `rock`, `paper`, or `scissors`.", threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      author: senderID,
      messageID: info.messageID
    });
  }, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  const userChoice = body.toLowerCase();
  const choices = ["rock", "paper", "scissors"];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  if (!choices.includes(userChoice)) {
    return api.sendMessage("❌ Please reply with either `rock`, `paper`, or `scissors`.", threadID, messageID);
  }

  let result = "";

  if (userChoice === botChoice) {
    result = "🤝 It's a draw!";
  } else if (
    (userChoice === "rock" && botChoice === "scissors") ||
    (userChoice === "paper" && botChoice === "rock") ||
    (userChoice === "scissors" && botChoice === "paper")
  ) {
    result = "🎉 You win!";
  } else {
    result = "😢 I win!";
  }

  api.sendMessage(`You chose: ${userChoice}\nI chose: ${botChoice}\n\n${result}`, threadID, messageID);
};
