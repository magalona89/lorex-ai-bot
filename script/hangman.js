module.exports.config = {
  name: "hangman",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: [],
  description: "Classic Hangman game",
  usages: "hangman",
  credits: "OpenAI x You",
  cooldowns: 3
};

module.exports.run = async function({ api, event }) {
  const words = ["banana", "dragon", "keyboard", "school", "github", "hangman"];
  const word = words[Math.floor(Math.random() * words.length)];
  const display = word.replace(/./g, "_");

  api.sendMessage(`🔤 HANGMAN GAME 🔤\n\nWord: ${display}\n\nGuess a letter by replying to this message!`, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      word,
      guessedLetters: [],
      display,
      author: event.senderID
    });
  }, event.messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID !== handleReply.author) return;

  const letter = body.toLowerCase().trim();

  if (!/^[a-zA-Z]$/.test(letter)) {
    return api.sendMessage("❗ Please guess only one letter (a-z).", threadID, messageID);
  }

  if (handleReply.guessedLetters.includes(letter)) {
    return api.sendMessage("❗ You already guessed that letter.", threadID, messageID);
  }

  handleReply.guessedLetters.push(letter);

  let newDisplay = '';
  let correct = false;

  for (let char of handleReply.word) {
    if (handleReply.guessedLetters.includes(char)) {
      newDisplay += char;
      correct = true;
    } else {
      newDisplay += "_";
    }
  }

  if (newDisplay === handleReply.word) {
    return api.sendMessage(`🎉 You guessed it! The word was: ${handleReply.word}`, threadID, messageID);
  } else {
    handleReply.display = newDisplay;
    api.sendMessage(`🪢 Word: ${newDisplay}\n\n✅ Correct guesses: ${handleReply.guessedLetters.join(', ')}`, threadID, (err, info) => {
      global.client.handleReply.push({
        ...handleReply,
        messageID: info.messageID
      });
    });
  }
};
