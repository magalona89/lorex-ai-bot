const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: 'menu',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['help', 'commands', 'cmds'],
  description: 'View a list of all available commands',
  usages: 'menu',
  credits: 'Messandra Dev Team',
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    // Get sender's name
    const userInfo = await api.getUserInfo(senderID);
    const userName = userInfo[senderID]?.name || 'User';

    // Get Philippine time
    const datePH = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Get all command files
    const commandFolder = __dirname;
    const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'));

    let commandList = `🤖 𝗠𝗲𝘀𝘀𝗮𝗻𝗱𝗿𝗮 𝗔𝗜 𝗩𝟱 - 𝗛𝗲𝗹𝗽 𝗠𝗲𝗻𝘂\n\n👤 Requested by: ${userName}\n🕒 Date & Time: ${datePH}\n\n`;

    for (const file of commandFiles) {
      const command = require(path.join(commandFolder, file)).config;

      if (!command || command.hidden) continue;

      commandList += `📌 ${command.name}`;
      if (command.aliases?.length) {
        commandList += ` (aliases: ${command.aliases.join(', ')})`;
      }
      if (command.description) {
        commandList += `\n    📝 ${command.description}`;
      }
      if (command.usages) {
        commandList += `\n    📖 Usage: ${command.usages}`;
      }
      commandList += '\n\n';
    }

    return api.sendMessage(commandList.trim(), threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage('❌ Error generating command list. Please try again later.', threadID, messageID);
  }
};
