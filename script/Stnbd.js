const axios = require('axios');

module.exports.config = {
  name: 'publicapi',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['api', 'freeapi'],
  description: "Get info from FreePublicAPIs: specific, list, or random",
  usages: "publicapi [mode] [id]",
  credits: 'FreePublicAPIs',
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const mode = args[0]?.toLowerCase() || 'random';
  // modes: "id", "list", "random"
  let url;
  if (mode === 'id') {
    const id = args[1];
    if (!id) {
      return api.sendMessage("❌ Please specify API id. Usage: `publicapi id 275`", threadID, messageID);
    }
    url = `https://www.freepublicapis.com/api/apis/${id}`;
  } else if (mode === 'list') {
    // you can provide limit & sort as next args, or default
    const limit = args[1] || '10';
    const sort = args[2] || 'best';
    url = `https://www.freepublicapis.com/api/apis?limit=${limit}&sort=${sort}`;
  } else {
    // default random
    url = `https://www.freepublicapis.com/api/random`;
  }

  // send loading message
  const loadingMsg = await new Promise(resolve => {
    api.sendMessage(`🔍 Fetching data from FreePublicAPIs (${mode})...`, threadID, (err, info) => resolve(info));
  });

  try {
    const res = await axios.get(url);
    const data = res.data;

    let text = `📡 FreePublicAPIs — mode: ${mode}\n`;

    if (mode === 'id') {
      // data is single object
      text += `\nName: ${data.name || 'N/A'}` +
              `\nDescription: ${data.description || 'N/A'}` +
              `\nAuth: ${data.auth || 'N/A'}` +
              `\nHTTPS: ${data.https}` +
              `\nCors: ${data.cors}` +
              `\nLink: ${data.link || 'N/A'}` +
              `\nCategory: ${data.category || 'N/A'}`;
    } else if (mode === 'list') {
      // data is array
      const list = data.apis || data;  // depending on response shape
      list.forEach((item, idx) => {
        text += `\n${idx + 1}. ${item.name} — ${item.description}`;
      });
    } else {
      // random
      // might return one object or array
      const obj = Array.isArray(data) ? data[0] : data;
      text += `\nName: ${obj.name || 'N/A'}` +
              `\nDescription: ${obj.description || 'N/A'}` +
              `\nAuth: ${obj.auth || 'N/A'}` +
              `\nHTTPS: ${obj.https}` +
              `\nCors: ${obj.cors}` +
              `\nLink: ${obj.link || 'N/A'}` +
              `\nCategory: ${obj.category || 'N/A'}`;
    }

    await api.editMessage(text, loadingMsg.messageID, threadID);
  } catch (error) {
    console.error("FreePublicAPIs error:", error.response?.data || error.message);
    await api.editMessage("❌ Error fetching from FreePublicAPIs. Try again later.", loadingMsg.messageID, threadID);
  }
};
