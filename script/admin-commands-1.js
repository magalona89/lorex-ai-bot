
module.exports.config = {
  name: 'admincmd1',
  version: '1.0.0',
  hasPermission: 3,
  usePrefix: true,
  aliases: ['ac1'],
  description: "Admin command pack 1",
  usages: "admincmd1 [subcommand]",
  credits: 'Admin',
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const cmd = args[0]?.toLowerCase();
  const tid = event.threadID;
  const mid = event.messageID;

  const commands = {
    banuser: () => api.sendMessage("🔨 User banned from bot", tid, mid),
    unbanuser: () => api.sendMessage("✅ User unbanned", tid, mid),
    warnuser: () => api.sendMessage("⚠️ Warning issued", tid, mid),
    muteuser: () => api.sendMessage("🔇 User muted", tid, mid),
    unmuteuser: () => api.sendMessage("🔊 User unmuted", tid, mid),
    kickall: () => api.sendMessage("👢 All users kicked", tid, mid),
    banall: () => api.sendMessage("🔨 All users banned", tid, mid),
    clearwarnings: () => api.sendMessage("🧹 Warnings cleared", tid, mid),
    viewwarnings: () => api.sendMessage("📋 Viewing warnings", tid, mid),
    tempban: () => api.sendMessage("⏱️ Temporary ban applied", tid, mid),
    permaban: () => api.sendMessage("🚫 Permanent ban applied", tid, mid),
    userinfo: () => api.sendMessage("ℹ️ User information", tid, mid),
    userstats: () => api.sendMessage("📊 User statistics", tid, mid),
    activelist: () => api.sendMessage("👥 Active users list", tid, mid),
    inactivelist: () => api.sendMessage("💤 Inactive users list", tid, mid),
    viplist: () => api.sendMessage("⭐ VIP users list", tid, mid),
    addvip: () => api.sendMessage("⭐ VIP status added", tid, mid),
    removevip: () => api.sendMessage("❌ VIP status removed", tid, mid),
    setrank: () => api.sendMessage("🎖️ Rank set", tid, mid),
    viewrank: () => api.sendMessage("🎖️ Viewing rank", tid, mid),
    resetrank: () => api.sendMessage("🔄 Rank reset", tid, mid),
    addcoins: () => api.sendMessage("💰 Coins added", tid, mid),
    removecoins: () => api.sendMessage("💸 Coins removed", tid, mid),
    setcoins: () => api.sendMessage("💵 Coins set", tid, mid),
    viewbalance: () => api.sendMessage("💳 Balance viewed", tid, mid),
    transfercoins: () => api.sendMessage("💱 Coins transferred", tid, mid),
    coinhistory: () => api.sendMessage("📜 Coin history", tid, mid),
    reseteconomy: () => api.sendMessage("🔄 Economy reset", tid, mid),
    economystats: () => api.sendMessage("📈 Economy stats", tid, mid),
    richestusers: () => api.sendMessage("💎 Richest users", tid, mid),
    poorestusers: () => api.sendMessage("📉 Poorest users", tid, mid),
    setlevel: () => api.sendMessage("📊 Level set", tid, mid),
    addexp: () => api.sendMessage("⬆️ Experience added", tid, mid),
    viewlevel: () => api.sendMessage("📊 Level viewed", tid, mid),
    leaderboard: () => api.sendMessage("🏆 Leaderboard displayed", tid, mid),
    resetlevels: () => api.sendMessage("🔄 Levels reset", tid, mid),
    giveitem: () => api.sendMessage("🎁 Item given", tid, mid),
    takeitem: () => api.sendMessage("📦 Item taken", tid, mid),
    viewinventory: () => api.sendMessage("🎒 Inventory viewed", tid, mid),
    clearinventory: () => api.sendMessage("🧹 Inventory cleared", tid, mid),
    addpermission: () => api.sendMessage("🔑 Permission added", tid, mid),
    removepermission: () => api.sendMessage("🔒 Permission removed", tid, mid),
    viewpermissions: () => api.sendMessage("🔐 Permissions viewed", tid, mid),
    setcooldown: () => api.sendMessage("⏲️ Cooldown set", tid, mid),
    bypasscooldown: () => api.sendMessage("⚡ Cooldown bypassed", tid, mid),
    resetcooldowns: () => api.sendMessage("🔄 Cooldowns reset", tid, mid),
    mutethread: () => api.sendMessage("🔇 Thread muted", tid, mid),
    unmutethread: () => api.sendMessage("🔊 Thread unmuted", tid, mid),
    lockthread: () => api.sendMessage("🔒 Thread locked", tid, mid),
    unlockthread: () => api.sendMessage("🔓 Thread unlocked", tid, mid)
  };

  if (commands[cmd]) {
    commands[cmd]();
  } else {
    api.sendMessage("📋 Admin Pack 1: 50 commands available\nUse: banuser, unbanuser, warnuser, muteuser, etc.", tid, mid);
  }
};
