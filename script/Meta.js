const axios = require('axios');

// Bold font converter (𝗕𝗼𝗹𝗱)
function convertToBold(text) {
  const boldMap = {
    'a': '𝗮','b': '𝗯','c': '𝗰','d': '𝗱','e': '𝗲','f': '𝗳','g': '𝗴','h': '𝗵','i': '𝗶','j': '𝗷',
    'k': '𝗸','l': '𝗹','m': '𝗺','n': '𝗻','o': '𝗼','p': '𝗽','q': '𝗾','r': '𝗿','s': '𝘀','t': '𝘁',
    'u': '𝘂','v': '𝘃','w': '𝘄','x': '𝘅','y': '𝘆','z': '𝘇',
    'A': '𝗔','B': '𝗕','C': '𝗖','D': '𝗗','E': '𝗘','F': '𝗙','G': '𝗚','H': '𝗛','I': '𝗜','J': '𝗝',
    'K': '𝗞','L': '𝗟','M': '𝗠','N': '𝗡','O': '𝗢','P': '𝗣','Q': '𝗤','R': '𝗥','S': '𝗦','T': '𝗧',
    'U': '𝗨','V': '𝗩','W': '𝗪','X': '𝗫','Y': '𝗬','Z': '𝗭',
  };
  return text.split('').map(c => boldMap[c] || c).join('');
}

module.exports.config = {
  name: 'llama',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['llama', 'l3t'],
  description: 'Chat with LLaMA 3 Turbo via Kaiz API',
  usages: 'llama3turbo [your message]',
  credits: 'You',
  cooldowns: 0
};

// Temporary message while waiting for API response
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
    return api.sendMessage('❓Please provide a prompt.\n\nExample: llama3turbo Hello!', threadID, messageID);
  }

  const temp = await sendTemp(api, threadID, '🔄 𝗣𝗿𝗼𝗰𝗲𝘀𝘀𝗶𝗻𝗴 𝗿𝗲𝗾𝘂𝗲𝘀𝘁 𝘁𝗼 𝗟𝗟𝗔𝗠𝗔-𝟯...');

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/llama3-turbo', {
      params: {
        ask,
        uid,
        apikey: '5ce15f34-7e46-4e7e-8ee7-5e934afe563b'
      }
    });

    const response = data?.response || data?.reply || data?.answer;

    if (!response) {
      return api.editMessage('⚠️ No valid response received from LLaMA-3.', temp.messageID, threadID);
    }

    // Optional: format with bold from markdown-like input
    const formatted = response
      .replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t)) // convert **text** to bold
      .replace(/##(.*?)##/g, (_, t) => convertToBold(t))     // convert ##text## to bold
      .replace(/\n{3,}/g, '\n\n');

    const header = convertToBold("LLAMA-3 TURBO");

    return api.editMessage(`🤖 ${header}\n\n${formatted}`, temp.messageID, threadID);

  } catch (err) {
    console.error('❌ LLaMA-3 Turbo API Error:', err);
    return api.editMessage('❌ Failed to connect to LLaMA-3 Turbo API.', temp.messageID, threadID);
  }
};
