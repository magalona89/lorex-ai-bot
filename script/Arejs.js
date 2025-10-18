/**
 * Aria v5.2.0
 * Full feature set: protection, maintenance, 31 toggles, auto-replies, reports, rules, auto-ban
 *
 * NOTE: Move keys to env vars before production.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ========== CONFIG FILE ==========
const SETTINGS_FILE = path.join(__dirname, 'aria_settings.json');

// Default settings (31 features)
const defaultSettings = {
  maintenance: false,
  protectionMode: false,
  ownerIDs: ["61580959514473"], // global owner(s) who can always control Aria
  features: {
    // 1-30 (previous list)
    boldFormatting: true,             // 1
    profanityFilter: true,            // 2
    aiRetrySystem: true,              // 3
    weatherAutoSearch: true,          // 4
    ttsVoiceReplies: true,            // 5
    philippineTimeDisplay: true,      // 6
    tipMessages: true,                // 7
    reactionEmojis: true,             // 8
    errorLogs: true,                  // 9
    autoReplies: true,                // 10
    aiPersonalityFriendly: true,      // 11
    aiPersonalityFormal: false,       // 12
    aiPersonalityHumor: false,        // 13
    weatherEmojis: true,              // 14
    ttsAutoResponse: false,           // 15
    responseTypingEffect: false,      // 16
    aiSummarizeLongText: false,       // 17
    commandLogging: false,            // 18
    adminNotifications: true,         // 19
    systemHealthCheck: true,          // 20
    aiQuoteMode: false,               // 21
    aiFactMode: false,                // 22
    weatherTips: true,                // 23
    aiShortResponses: false,          // 24
    aiDetailedResponses: true,        // 25
    ttsVoiceSelect: false,            // 26
    languageDetection: false,         // 27
    dailyGreeting: false,             // 28
    eventReminders: false,            // 29
    debugMode: false,                 // 30
    // 31 - new auto-ban feature
    autoBan: true                     // 31
  }
};

// load/save settings
function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE));
  } catch (e) {
    // if corrupted, reset
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    return JSON.parse(fs.readFileSync(SETTINGS_FILE));
  }
}
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// ========== HELPERS ==========
function convertToBold(text) {
  const boldMap = {
    'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
    'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭'
  };
  return text.split('').map(c => boldMap[c] || c).join('');
}

function getPhilippineDateTime() {
  try {
    const now = new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return now.replace(',', ' •');
  } catch {
    return 'Date unavailable';
  }
}

function hasProfanity(text) {
  const badWords = ['badword1','badword2']; // extend as needed
  return badWords.some(w => text.toLowerCase().includes(w));
}

// minimal location map (extend if needed)
const locationMap = {
  'philippines':'Manila','japan':'Tokyo','thailand':'Bangkok','vietnam':'Hanoi','singapore':'Singapore',
  'malaysia':'Kuala Lumpur','south korea':'Seoul','indonesia':'Jakarta','india':'New Delhi','australia':'Canberra'
};

// ========== AUTO-BAN SYSTEM (IN-MEMORY) ==========
const userCommandTimestamps = new Map(); // userID -> [timestamps]
const bannedUsers = new Map();           // userID -> unbanTimestamp (ms)
const MESSAGE_LIMIT = 1;                 // commands allowed per window
const COOLDOWN_WINDOW = 10 * 1000;       // 10 seconds
const BAN_DURATION = 60 * 1000;          // 1 minute ban

function isUserBanned(userID) {
  const unbanAt = bannedUsers.get(userID);
  if (!unbanAt) return false;
  if (Date.now() > unbanAt) {
    bannedUsers.delete(userID);
    return false;
  }
  return true;
}
function recordUserMessage(userID) {
  const now = Date.now();
  const arr = (userCommandTimestamps.get(userID) || []).filter(t => now - t < COOLDOWN_WINDOW);
  arr.push(now);
  userCommandTimestamps.set(userID, arr);
  return arr.length;
}

// ========== AUTO-REPLIES ==========
const autoReplyTriggers = {
  hi: "Hey there! 😊 How’s your day?",
  hello: "Hello! 👋 Need something?",
  "good morning": "☀️ Good morning! Ready to start your day?",
  "good night": "🌙 Sweet dreams! Rest well.",
  kamusta: "Mabuti! Ikaw, kamusta ka naman?",
  thanks: "You’re welcome 💖!",
  ty: "No problem!",
  bye: "👋 See you soon!"
};

// ========== COMMAND INFO ==========
module.exports.config = {
  name: 'aria1',
  version: '5.2.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aria','betadas','ariaweather'],
  description: "Aria AI Assistant (pro): protection, maintenance, settings, auto-reply, report, rules, autoban",
  usages: "aria [mode/weather/tts/report/rules/admin] [args]",
  credits: 'Betadash API, WeatherAPI, Typecast AI',
  cooldowns: 0,
  dependencies: { "axios": "" }
};

// ========== MAIN ==========
module.exports.run = async function({ api, event, args, Users, Threads }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  const rawArgs = args.slice();
  const input = args.join(' ').trim();
  const settings = loadSettings();
  const maxLength = 1200;

  // attempt to get thread info (admins)
  let threadInfo = {};
  try { threadInfo = await api.getThreadInfo(threadID); } catch (e) { /* ignore */ }
  const threadAdmins = (threadInfo.adminIDs || []).map(a => a.id);
  const isThreadAdmin = threadAdmins.includes(senderID);
  const isOwner = (settings.ownerIDs || []).includes(String(senderID));
  const isPrivileged = isThreadAdmin || isOwner;

  // If protection mode is on and user is not privileged, block commands (except admin commands if they are admin)
  if (settings.protectionMode && !isPrivileged && rawArgs[0] !== "admin") {
    return api.sendMessage("🚫 Aria is in protection mode. Only admins/owners can use me right now.", threadID, messageID);
  }

  // Maintenance block (admins/owners can still run admin commands)
  if (settings.maintenance && rawArgs[0] !== "admin" && !isPrivileged) {
    return api.sendMessage("🛠 Aria is currently under maintenance. Please try again later.", threadID, messageID);
  }

  // ADMIN HANDLERS
  if (rawArgs[0] === "admin") {
    // only privileged users
    if (!isPrivileged) return api.sendMessage("⚠️ Only admins/owners can use admin commands.", threadID, messageID);

    const sub = rawArgs[1];
    if (!sub) return api.sendMessage("⚙️ Admin commands: maintenance | protection | settings | unban | banlist | reportto", threadID, messageID);

    // toggle maintenance
    if (sub === "maintenance") {
      settings.maintenance = !settings.maintenance;
      saveSettings(settings);
      return api.sendMessage(`⚙️ Maintenance mode: ${settings.maintenance ? "ON 🛠" : "OFF ✅"}`, threadID, messageID);
    }

    // toggle protection
    if (sub === "protection") {
      settings.protectionMode = !settings.protectionMode;
      saveSettings(settings);
      return api.sendMessage(`🛡 Protection mode: ${settings.protectionMode ? "ON (Admin only)" : "OFF (Everyone allowed)"}`, threadID, messageID);
    }

    // settings list / toggle
    if (sub === "settings") {
      const action = rawArgs[2];
      if (!action) return api.sendMessage("⚙️ Use: aria admin settings list | aria admin settings toggle [1-31]", threadID, messageID);

      if (action === "list") {
        let msg = "📋 Aria Settings:\n━━━━━━━━━━━━━━\n";
        const keys = Object.keys(settings.features);
        keys.forEach((k,i) => { msg += `${i+1}. ${k} — ${settings.features[k] ? "✅ ON" : "❌ OFF"}\n`; });
        msg += `\n🛡 Protection Mode: ${settings.protectionMode ? "ON" : "OFF"}`;
        msg += `\n🛠 Maintenance Mode: ${settings.maintenance ? "ON" : "OFF"}`;
        return api.sendMessage(msg, threadID, messageID);
      }

      if (action === "toggle") {
        const n = parseInt(rawArgs[3]);
        const keys = Object.keys(settings.features);
        if (isNaN(n) || n < 1 || n > keys.length) return api.sendMessage("⚠️ Invalid feature number. Use list first.", threadID, messageID);
        const key = keys[n-1];
        settings.features[key] = !settings.features[key];
        saveSettings(settings);

        // notify owners if adminNotifications is on
        if (settings.features.adminNotifications) {
          (settings.ownerIDs || []).forEach(owner => {
            try { api.sendMessage(`🔁 ${key} is now ${settings.features[key] ? "ON" : "OFF"} (toggled by ${senderID})`, owner); } catch(e) {}
          });
        }

        return api.sendMessage(`🔁 ${key} is now ${settings.features[key] ? "ON ✅" : "OFF ❌"}`, threadID, messageID);
      }

      return api.sendMessage("⚙️ Use: aria admin settings list | aria admin settings toggle [1-31]", threadID, messageID);
    }

    // unban a user (admin)
    if (sub === "unban") {
      const uid = rawArgs[2];
      if (!uid) return api.sendMessage("⚠️ Usage: aria admin unban [userID]", threadID, messageID);
      if (bannedUsers.has(uid)) {
        bannedUsers.delete(uid);
        return api.sendMessage(`✅ User ${uid} unbanned.`, threadID, messageID);
      } else {
        return api.sendMessage("ℹ️ That user is not banned.", threadID, messageID);
      }
    }

    // banlist
    if (sub === "banlist") {
      const list = Array.from(bannedUsers.entries()).map(([id, ts]) => `${id} (until ${new Date(ts).toLocaleString()})`).join("\n") || "No banned users.";
      return api.sendMessage(`🚫 Banned users:\n${list}`, threadID, messageID);
    }

    // redirect reports to another admin id
    if (sub === "reportto") {
      const target = rawArgs[2];
      if (!target) return api.sendMessage("Usage: aria admin reportto [adminID]", threadID, messageID);
      settings.ownerIDs = [String(target)];
      saveSettings(settings);
      return api.sendMessage(`✅ Reports will now be sent to ${target}`, threadID, messageID);
    }

    return api.sendMessage("⚙️ Admin commands: maintenance | protection | settings | unban | banlist | reportto", threadID, messageID);
  } // end admin

  // AUTO-BAN CHECK (if enabled)
  if (settings.features.autoBan) {
    // owners/privileged are exempt
    if (!isPrivileged) {
      if (isUserBanned(senderID)) {
        return api.sendMessage("🚫 You are temporarily blocked for spamming Aria commands. Please wait a bit.", threadID, messageID);
      }
      const cnt = recordUserMessage(senderID);
      if (cnt > MESSAGE_LIMIT) {
        bannedUsers.set(senderID, Date.now() + BAN_DURATION);
        // inform group & owner(s)
        api.sendMessage("⚠️ You’ve been auto-banned for spamming Aria commands. Try again later.", threadID, messageID);
        (settings.ownerIDs || []).forEach(owner => {
          try {
            api.sendMessage(`🚨 Auto-ban triggered: ${senderID} banned until ${new Date(Date.now()+BAN_DURATION).toLocaleString()}`, owner);
          } catch (e) {}
        });
        return;
      }
    }
  }

  // HELP (no input)
  if (!input) {
    const help = `🤖 𝗔𝗿𝗶𝗮 v5.2.0\n━━━━━━━━━━━━━━\nCommands:\n• aria [mode] [text] — modes: general, creative, analytical, storytelling, tts\n• aria weather [city/country]\n• aria tts [text]\n• aria report [message] — send feedback to admin\n• aria rules — show group rules\n\nAdmin:\n• aria admin maintenance\n• aria admin protection\n• aria admin settings list\n• aria admin settings toggle [1-31]\n• aria admin unban [userID]\n• aria admin banlist\n\nTip: use aria admin settings list to see feature numbers.`;
    return api.sendMessage(help, threadID, messageID);
  }

  // LENGTH & profanity checks
  if (input.length > maxLength) return api.sendMessage(`⚠️ Input too long! Max ${maxLength} characters.`, threadID, messageID);
  if (settings.features.profanityFilter && hasProfanity(input)) return api.sendMessage("🚫 Inappropriate content detected. Keep it clean!", threadID, messageID);

  // AUTO-REPLY: react to plain messages in chat (when feature enabled)
  // Only trigger when input is short and matches a trigger phrase exactly.
  if (settings.features.autoReplies && input.length < 40) {
    const lower = input.toLowerCase();
    for (const trig of Object.keys(autoReplyTriggers)) {
      if (lower === trig) {
        // If protection mode prohibits non-admins, check earlier already handled.
        return api.sendMessage(autoReplyTriggers[trig], threadID, messageID);
      }
    }
  }

  // Special quick commands: report & rules
  const parts = input.split(' ');
  const cmd = parts[0].toLowerCase();

  // REPORT system: aria report [message]
  if (cmd === "report") {
    const reportMsg = parts.slice(1).join(' ').trim();
    if (!reportMsg) return api.sendMessage("📝 Please include a message after 'aria report'.", threadID, messageID);

    const reporterID = senderID;
    let reporterName = reporterID;
    try {
      const info = await api.getUserInfo(reporterID);
      reporterName = (info && info[reporterID] && info[reporterID].name) || reporterName;
    } catch (e) {}

    const dateTime = getPhilippineDateTime();
    const confirm = "✅ Your report has been sent to the admin. Thank you!";
    api.sendMessage(confirm, threadID, messageID);

    const adminTargets = settings.ownerIDs && settings.ownerIDs.length ? settings.ownerIDs : ["61580959514473"];
    const reportPayload = `📩 𝗡𝗘𝗪 𝗥𝗘𝗣𝗢𝗥𝗧\n━━━━━━━━━━━━━━\n👤 From: ${reporterName} (${reporterID})\n🕒 ${dateTime}\n\n🗒 Message:\n${reportMsg}`;
    // send to each owner (owner can be threadID or userID)
    adminTargets.forEach(target => {
      try { api.sendMessage(reportPayload, target); } catch (e) {}
    });
    return;
  }

  // RULES command: aria rules
  if (cmd === "rules") {
    const rulesMessage = `📜 𝗔𝗿𝗶𝗮 𝗚𝗿𝗼𝘂𝗽 𝗥𝘂𝗹𝗲𝘀\n━━━━━━━━━━━━━━\n1️⃣ Be respectful — no insults or harassment.\n2️⃣ No spam or flooding the chat.\n3️⃣ Avoid NSFW or violent content.\n4️⃣ Use commands responsibly.\n5️⃣ Follow admin instructions at all times.\n\n🚫 Violations may result in warn/mute/ban.`;
    return api.sendMessage(rulesMessage, threadID, messageID);
  }

  // WEATHER handler (starts with "weather ")
  if (cmd === "weather") {
    let city = parts.slice(1).join(' ').trim();
    if (!city) city = "Manila";
    if (settings.features.weatherAutoSearch) {
      const mapped = Object.keys(locationMap).find(k => k.toLowerCase() === city.toLowerCase());
      if (mapped) {
        city = locationMap[mapped];
        api.sendMessage(`🔍 Auto-searched: ${mapped} → ${city}`, threadID, messageID);
      }
    }

    // Fetch weather (ensure you set WEATHER_API_KEY in env)
    const WEATHER_KEY = process.env.WEATHER_API_KEY || '8d4c6ed946d54f4eb4360142251710'; // replace with env var
    try {
      const { data } = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_KEY}&q=${encodeURIComponent(city)}&days=1&aqi=yes&alerts=yes`);
      const c = data.current, f = data.forecast.forecastday[0].day;
      const dateTime = settings.features.philippineTimeDisplay ? getPhilippineDateTime() : "";
      const emoji = settings.features.weatherEmojis ? '🌤️ ' : '';
      let reply = `${emoji}Weather in ${data.location.name}, ${data.location.country}\n${dateTime}\n━━━━━━━━━━━━━━\n🌡 Temp: ${c.temp_c}°C\n🌥 Condition: ${c.condition.text}\n☔ Chance of rain: ${f.daily_chance_of_rain}%\n💨 Wind: ${c.wind_kph} kph\n`;
      if (settings.features.weatherTips) reply += `\n💡 Tip: Bring an umbrella if chance of rain > 50%.\n`;
      return api.sendMessage(reply, threadID, messageID);
    } catch (e) {
      if (settings.features.errorLogs) {
        try { fs.appendFileSync(path.join(__dirname,'aria_errors.log'), `[${new Date().toISOString()}] weather error: ${e.message}\n`); } catch(e){}
      }
      return api.sendMessage("❌ Failed to fetch weather data. Make sure the city/country name is correct.", threadID, messageID);
    }
  }

  // TTS (mode) — quick handler: "tts [text]"
  if (cmd === "tts" && settings.features.ttsVoiceReplies) {
    const text = parts.slice(1).join(' ').trim();
    if (!text) return api.sendMessage("⚠️ Usage: aria tts [text]", threadID, messageID);

    // Typecast / TTS - you MUST set TYPECAST_API_KEY in env
    const TYPECAST_KEY = process.env.TYPECAST_API_KEY || '__TYPECAST_KEY__';
    try {
      api.sendMessage("🔄 Generating voice...", threadID, messageID);
      const resp = await axios.post('https://api.typecast.ai/v1/text-to-speech', {
        voice_id: 'tc_689450bdcce4027c2f06eee8',
        text,
        model: 'ssfm-v21',
        language: 'eng',
        output: { audio_format: 'wav' }
      }, { headers: { 'X-API-KEY': TYPECAST_KEY }, timeout: 30000 });

      if (!resp.data || !resp.data.audio_url) return api.sendMessage("⚠️ Failed to generate audio.", threadID, messageID);
      const audioUrl = resp.data.audio_url;
      const audioStream = await axios.get(audioUrl, { responseType: 'stream' });
      return api.sendMessage({ body: `🎤 Aria Voice:\n"${text}"`, attachment: audioStream.data }, threadID, messageID);
    } catch (e) {
      if (settings.features.errorLogs) {
        try { fs.appendFileSync(path.join(__dirname,'aria_errors.log'), `[${new Date().toISOString()}] tts error: ${e.message}\n`); } catch(e){}
      }
      return api.sendMessage("⛔ Error generating voice. Check TTS key or try later.", threadID, messageID);
    }
  }

  // AI MODE (fallback): send to betadash assistant
  // Build mode if first arg is one of known modes
  const modes = ['general','creative','analytical','storytelling'];
  let mode = 'general';
  if (modes.includes(parts[0].toLowerCase())) {
    mode = parts.shift().toLowerCase();
  }

  // Compose prompt and call external AI (ensure API endpoint accessible)
  try {
    const enhancedPrompt = `[Mode: ${mode}] ${input}`;
    const betadashURL = process.env.BETADASH_URL || 'https://betadash-api-swordslush-production.up.railway.app/assistant';
    let resp = await axios.get(betadashURL, { params: { chat: enhancedPrompt }, timeout: 15000 });

    if ((!resp || !resp.data || !resp.data.response) && settings.features.aiRetrySystem) {
      resp = await axios.get(betadashURL, { params: { chat: enhancedPrompt }, timeout: 15000 });
    }

    if (!resp || !resp.data || !resp.data.response) {
      return api.sendMessage("⚠️ No response from AI service. Try again later.", threadID, messageID);
    }

    let textResp = resp.data.response;

    // formatting: bold
    if (settings.features.boldFormatting) {
      textResp = textResp.replace(/\*\*(.*?)\*\*/g, (_, t) => convertToBold(t));
    }

    // personality adjustments (simple)
    if (settings.features.aiPersonalityFriendly) {
      textResp = `Hey! ${textResp}`;
    } else if (settings.features.aiPersonalityFormal) {
      textResp = `Dear user, ${textResp}`;
    }
    // add tip
    const tip = settings.features.tipMessages ? "\n\n💡 Tip: Try 'aria tts [text]' for voice." : "";
    const dateTime = settings.features.philippineTimeDisplay ? getPhilippineDateTime() : "";

    // final message
    const finalMsg = `🤖 𝗔𝗿𝗶𝗮 𝗔𝗜 (${convertToBold(mode)} Mode)\n${dateTime ? `🕒 ${dateTime}\n` : ''}━━━━━━━━━━━━━━\n${textResp}${tip}`;
    return api.sendMessage(finalMsg, threadID, messageID);

  } catch (e) {
    if (settings.features.errorLogs) {
      try { fs.appendFileSync(path.join(__dirname,'aria_errors.log'), `[${new Date().toISOString()}] ai error: ${e.message}\n`); } catch(e){}
    }
    return api.sendMessage("⛔ An error occurred while contacting the AI service. Please try again later.", threadID, messageID);
  }
}; // end run
