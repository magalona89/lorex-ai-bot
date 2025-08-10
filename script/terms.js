const fs = require('fs');
const path = require('path');
const acceptedPath = path.join(__dirname, 'acceptedUsers.json');

if (!fs.existsSync(acceptedPath)) fs.writeFileSync(acceptedPath, JSON.stringify([]));

module.exports.config = {
  name: 'terms',
  version: '2.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['tos', 'privacy', 'policy', 'accept', 'agree'],
  description: 'Shows the Terms of Service and allows acceptance',
  usages: 'terms | accept',
  credits: 'Messandra Dev Team',
  cooldowns: 0
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const command = body.trim().toLowerCase();

  // Load accepted users
  let acceptedUsers = JSON.parse(fs.readFileSync(acceptedPath));

  // If user types accept or agree
  if (command === 'accept' || command === 'agree') {
    if (acceptedUsers.includes(senderID)) {
      return api.sendMessage("✅ You already accepted the Terms of Service.", threadID, messageID);
    }

    acceptedUsers.push(senderID);
    fs.writeFileSync(acceptedPath, JSON.stringify(acceptedUsers, null, 2));
    return api.sendMessage("✅ Thank you for accepting the Terms. You can now use Messandra AI freely.", threadID, messageID);
  }

  // Show Terms
  const tosMessage = `
📜 𝗧𝗲𝗿𝗺𝘀 𝗼𝗳 𝗦𝗲𝗿𝘃𝗶𝗰𝗲 & 𝗣𝗿𝗶𝘃𝗮𝗰𝘆 – 𝗠𝗲𝘀𝘀𝗮𝗻𝗱𝗿𝗮 𝗔𝗜 𝗩𝟱

🔹 This AI bot is for educational and entertainment purposes only.
🔹 Do not send illegal, abusive, or harmful content.
🔹 No permanent storage of private messages.
🔹 No data is shared with third parties.

✅ To continue, type: **accept** or **agree**
`;

  return api.sendMessage(tosMessage, threadID, messageID);
};
