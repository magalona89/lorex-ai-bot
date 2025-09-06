const axios = require('axios');

module.exports = {
  config: {
    name: "sim",
    version: "1.0",
    author: "hara",
    description: "Simple sim command with axios setup but no API call yet",
    usage: "sim <message> or reply to a message",
  },
  async onStart({ api, args, event }) {
    const authorHex = Buffer.from(this.config.author).toString('hex');
    if (authorHex !== '68617261') { // "hara" in hex
      api.sendMessage('Access Denied', event.threadID);
      return;
    }

    const ID = event.messageID;

    let input;
    if (event.type === "message_reply") {
      input = event.messageReply.body;
    } else if (args.length > 0) {
      input = args.join(" ");
    } else {
      api.sendMessage(`💬 | Usage: ${this.config.name} <message> or reply to a message`, event.threadID, ID);
      return;
    }

    if (!input || input.trim() === "") {
      api.sendMessage(`💬 | Please provide a message`, event.threadID, ID);
      return;
    }

    // Placeholder for future API call using axios
    // Example: await axios.get('some api url')

    // For now, just echo the input
    const reply = `You said: ${input}`;

    api.sendMessage(reply, event.threadID, ID);
  }
};
