const axios = require('axios');

module.exports.config = {
  name: 'quizbot',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['quiz', 'generatequiz'],
  description: 'Generate a quiz question via Daikyu Quiz API',
  usages: 'quizbot generate',
  credits: 'You',
  cooldowns: 0
};

async function sendTemp(api, threadID, message) {
  return new Promise(resolve => {
    api.sendMessage(message, threadID, (err, info) => resolve(info));
  });
}

module.exports.run = async function({ api, event, args }) {
  const action = args[0]?.toLowerCase();
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (action !== 'generate' && action !== 'ask') {
    return api.sendMessage(
      '❌ To generate a quiz question, use:\nquizbot generate',
      threadID,
      messageID
    );
  }

  const temp = await sendTemp(api, threadID, '🔄 Generating quiz question...');

  try {
    const { data } = await axios.get(
      'https://daikyu-api.up.railway.app/api/quiz',
      { params: { question: 'generate' } }
    );

    if (!data) {
      return api.editMessage(
        '⚠️ No response from the Quiz API.',
        temp.messageID,
        threadID
      );
    }

    // Assume response contains text or JSON. We stringify for safety.
    const output = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return api.editMessage(
      `🎲 **Here's your quiz question:**\n\n${output}`,
      temp.messageID,
      threadID
    );

  } catch (err) {
    console.error('Quiz API Error:', err);
    return api.editMessage(
      '❌ Unable to fetch quiz question. Try again later.',
      temp.messageID,
      threadID
    );
  }
};
