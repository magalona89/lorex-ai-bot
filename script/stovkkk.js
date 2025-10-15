const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://gagstock.gleeze.com';
const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CONFIG_FILE = path.join(__dirname, 'stocknotify_config.json');

// Load or initialize config
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ active: false, admins: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

let notifyInterval = null;

module.exports.config = {
  name: 'stocknotify',
  version: '1.1.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['stock', 'autoStock'],
  description: "Auto-notify stock updates every 5 minutes with on/off toggle",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const threadID = event.threadID;
  const senderID = event.senderID;
  const config = loadConfig();
  const admins = config.admins.length ? config.admins : [senderID]; // first user as default admin

  const command = args[0]?.toLowerCase();

  // ------------------ Admin Commands ------------------
  if (['on', 'off'].includes(command)) {
    if (!admins.includes(senderID)) {
      return api.sendMessage("❌ Hindi ka authorized na i-toggle ang Stock Notify.", threadID);
    }

    if (command === 'on') {
      if (config.active) return api.sendMessage("⚠️ Stock Notify ay already ON.", threadID);
      config.active = true;
      saveConfig(config);
      api.sendMessage("✅ Stock Notify is now ON. Auto-updates every 5 minutes.", threadID);

      // Start interval
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => fetchStockAndNotify(api, threadID), FETCH_INTERVAL);
      // Immediate fetch
      fetchStockAndNotify(api, threadID);

    } else if (command === 'off') {
      if (!config.active) return api.sendMessage("⚠️ Stock Notify ay already OFF.", threadID);
      config.active = false;
      saveConfig(config);
      api.sendMessage("🛑 Stock Notify is now OFF.", threadID);
      if (notifyInterval) clearInterval(notifyInterval);
    }
    return;
  }

  // ------------------ Default Info ------------------
  api.sendMessage(`ℹ️ Usage:\nstocknotify on - Enable auto notifications\nstocknotify off - Disable auto notifications`, threadID);
};

// ------------------ Fetch and Notify ------------------
async function fetchStockAndNotify(api, threadID) {
  try {
    const res = await axios.get(`${BASE_URL}/api/stock`, { timeout: 10000 });
    if (res.data.status !== 'success') return;

    const { updated_at, data } = res.data;
    let msg = `📅 Stock updated at: ${updated_at}\n\n`;

    const standardCategories = ['egg', 'gear', 'seed', 'honey', 'cosmetics'];
    for (const cat of standardCategories) {
      const catData = data[cat];
      msg += `🏷️ ${cat.toUpperCase()} (Countdown: ${catData.countdown})\n`;
      catData.items.forEach(item => {
        msg += `  ${item.emoji} ${item.name} x${item.quantity}\n`;
      });
      msg += '\n';
    }

    const tm = data.travelingmerchant;
    msg += `🚚 Traveling Merchant (${tm.merchantName})\n`;
    msg += `Status: ${tm.status}\n`;
    if (tm.appearIn) msg += `Appears in: ${tm.appearIn}\n`;
    if (tm.countdown) msg += `Countdown: ${tm.countdown}\n`;
    tm.items.forEach(item => {
      msg += `  ${item.emoji} ${item.name} x${item.quantity}\n`;
    });

    await api.sendMessage(msg, threadID);

  } catch (error) {
    console.error('❌ Failed to fetch stock info:', error.message);
  }
}
