const axios = require('axios');

module.exports.config = {
  name: 'metaai',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['meta', 'llama'],
  description: 'AI chatbot using MetaAI API',
  usages: 'metaai [your message]',
  credits: 'You',
  cooldowns: 0
};

async function sendTemp(api, threadID, message) {
  return new Promise(resolve => {
    api.sendMessage(message, threadID, (err, info) => resolve(info));
  });
}

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ');
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!prompt) {
    return api.sendMessage('❌ Please provide a prompt.\n\nExample: llama Hello there!', threadID, messageID);
  }

  // Send temporary "processing" message
  const temp = await sendTemp(api, threadID, '🔄 Thinking...');

  try {
    const { data } = await axios.get('https://arychauhann.onrender.com/api/metaai', {
      params: {
        prompt,
        uid,
        reset: ''
      }
    });

    if (!data || !data.response) {
      return api.editMessage("⚠️ Empty or invalid response from MetaAI.", temp.messageID, threadID);
    }

    // Send the AI response
    return api.editMessage(`🤖 𝗠𝗲𝘁𝗮𝗔𝗜:\n\n${data.response}`, temp.messageID, threadID);

  } catch (err) {
    console.error('MetaAI error:', err);
    return api.editMessage("❌ Failed to get a response from MetaAI. Try again later.", temp.messageID, threadID);
  }
};
