const axios = require('axios');

module.exports.config = {
  name: 'llama',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['llama', 'l3t'],
  description: 'Chat with Llama‑3‑Turbo via Kaiz API',
  usages: 'llama3turbo [your message] (optional: reset)',
  credits: 'You',
  cooldowns: 0
};

async function sendTemp(api, threadID, message) {
  return new Promise(resolve => {
    api.sendMessage(message, threadID, (err, info) => resolve(info));
  });
}

module.exports.run = async function({ api, event, args }) {
  const ask = args.join(' ').trim();
  const uid = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!ask) {
    return api.sendMessage(
      '❓ Please provide a prompt. Example: llama Hello there!',
      threadID,
      messageID
    );
  }

  // Show temporary processing message
  const temp = await sendTemp(api, threadID, '🔄 Processing with Llama‑3‑Turbo...');

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/llama3-turbo', {
      params: {
        ask,
        uid,
        apikey: '5ce15f34-7e46-4e7e-8ee7-5e934afe563b'
      }
    });

    if (!data || (!data.response && !data.reply && !data.answer)) {
      return api.editMessage(
        '⚠️ Unexpected response format from Llama‑3‑Turbo.',
        temp.messageID,
        threadID
      );
    }

    // Choose appropriate key if exists
    const output =
      data.response || data.reply || data.answer || JSON.stringify(data);

    return api.editMessage(
      `🤖 **Llama‑3‑Turbo says:**\n\n${output}`,
      temp.messageID,
      threadID
    );

  } catch (err) {
    console.error('Llama‑3‑Turbo API error:', err);
    return api.editMessage(
      '❌ Failed to connect to Llama‑3‑Turbo API. Try again later.',
      temp.messageID,
      threadID
    );
  }
};
