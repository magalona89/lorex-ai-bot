const axios = require('axios');

module.exports.config = {
  name: 'text',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['t2v','video'],
  description: 'Generate video from text via Modelslab',
  usages: 'text2video <prompt>',
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function({ api, event, args }) {
  const prompt = args.join(' ').trim();
  if (!prompt) return api.sendMessage('✏️ Usage: text2video <prompt>', event.threadID, event.messageID);

  const API_URL = 'https://modelslab.com/api/v7/video-fusion/text-to-video';
  const API_KEY = process.env.MODELSLAB_KEY;
  if (!API_KEY) return api.sendMessage('⚠️ Server missing MODELSLAB_KEY env var.', event.threadID, event.messageID);

  try {
    await api.sendMessage('⌛ Generating video — this may take a bit...', event.threadID, event.messageID);
    const payload = { key: API_KEY, prompt, duration: 6, resolution: '512x512', format: 'mp4' };
    const res = await axios.post(API_URL, payload, { timeout: 120000 });

    if (res.data?.output?.[0]) {
      return api.sendMessage(`✅ Video ready: ${res.data.output[0]}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage('⚠️ Video generation completed but no output link returned. Check server logs.', event.threadID, event.messageID);
    }
  } catch (err) {
    console.error('Text2Video error:', err.response?.data || err.message);
    return api.sendMessage('❌ Error generating video. Check server logs for details.', event.threadID, event.messageID);
  }
};
