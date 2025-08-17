module.exports.config = {
  name: 'accept',
  version: '1.1.1',
  hasPermission: 1, // Thread admins only
  usePrefix: false,
  aliases: ['acceptreq', 'acceptfriend'],
  description: "Accept or decline friend requests (accept all or filtered)",
  usages: "accept [all]",
  credits: 'OpenAI x You',
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  const acceptAll = args[0]?.toLowerCase() === 'all';

  api.sendMessage(`🔍 Checking friend requests...\nMode: ${acceptAll ? '✅ Accept All' : '⚙️ Filtered'}`, threadID, messageID);

  try {
    const inbox = await api.getThreadList(0, 20, 'PENDING');
    const friendRequests = inbox.filter(thread => thread.isFriendRequest);

    if (friendRequests.length === 0) {
      return api.sendMessage("📭 No pending friend requests found.", threadID, messageID);
    }

    let accepted = 0;
    let declined = 0;

    for (const req of friendRequests) {
      const uid = req.threadID;
      const name = req.name;

      const shouldAccept = acceptAll ? true : customShouldAccept(uid, name);

      if (shouldAccept) {
        await api.handleFriendRequest(uid, true); // Accept
        accepted++;
        console.log(`✅ Accepted: ${name} (${uid})`);
      } else {
        await api.handleFriendRequest(uid, false); // Decline
        declined++;
        console.log(`❌ Declined: ${name} (${uid})`);
      }
    }

    return api.sendMessage(`🤖 Friend Request Processing Complete:\n\n➕ Accepted: ${accepted}\n➖ Declined: ${declined}`, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ An error occurred while processing requests.", threadID, messageID);
  }
};

// 🔧 Custom logic: Decline names with "bot", for example
function customShouldAccept(uid, name) {
  const lower = name.toLowerCase();

  // Decline bots or suspicious names
  if (lower.includes("bot") || lower.includes("test")) return false;

  // Accept all others
  return true;
}
