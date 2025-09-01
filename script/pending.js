module.exports.config = {
  name: "pending",
  version: "1.0",
  author: "NTKhang | ArYAN",
  cooldowns: 0,
  role: 0,
  description: "Approve pending groups in spam list or unapproved groups",
  category: "boxchat"
};

module.exports.run = async function({ api, event, args, getLang, commandName }) {
  const { threadID, messageID, senderID } = event;

  // Handle reply messages
  if (event.messageReply && global.GoatBot?.onReply?.has(event.messageReply.messageID)) {
    const Reply = global.GoatBot.onReply.get(event.messageReply.messageID);
    if (String(senderID) !== String(Reply.author)) return;

    const body = event.body.trim();
    let count = 0;

    if ((isNaN(body) && body.toLowerCase().startsWith("c")) || body.toLowerCase().startsWith("cancel")) {
      // Cancel request handling
      const index = body.slice(body.toLowerCase().startsWith("cancel") ? 6 : 1).trim().split(/\s+/);
      for (const singleIndex of index) {
        if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", singleIndex), threadID, messageID);

        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[singleIndex - 1].threadID);
        count++;
      }
      global.GoatBot.onReply.delete(event.messageReply.messageID);
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    } else {
      // Approve request handling
      const index = body.split(/\s+/);
      for (const singleIndex of index) {
        if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", singleIndex), threadID, messageID);

        api.sendMessage(`✨ 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻\n\nMessandra Ai has been approved by owners.`, Reply.pending[singleIndex - 1].threadID);
        count++;
      }
      global.GoatBot.onReply.delete(event.messageReply.messageID);
      return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
    }
  }

  // Initial command run (not a reply)
  let msg = "";

  try {
    const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
    const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];

    const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

    if (list.length === 0) {
      return api.sendMessage(getLang("returnListClean"), threadID, messageID);
    }

    for (const single of list) {
      msg += `╭────────────⟡\n│\n│ℹ️ 𝗡𝗮𝗺𝗲\n│${single.name}\n│\n│🆔 𝗜𝗗\n│${single.threadID}\n│\n╰───────────⟡\n\n`;
    }

    return api.sendMessage(getLang("returnListPending", list.length, msg), threadID, (err, info) => {
      if (!err) {
        if (!global.GoatBot.onReply) global.GoatBot.onReply = new Map();
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: senderID,
          pending: list
        });
      }
    }, messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
  }
};
