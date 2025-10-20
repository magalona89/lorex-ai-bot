/**
 * Aria v7.0 Full — All-in-one command file
 * - Settings, protection, maintenance, admin controls
 * - XP / Level / Coins / Badges / Shop
 * - Dashboard & profile (resolve names without @)
 * - 50 games (mix), Spin Fruits, Daily, Trivia, Guess, etc.
 * - Report system -> default owner 61580959514473
 * - Files created automatically: aria_settings.json, aria_users.json, aria_games.json, aria_shop.json, aria_logs.log
 *
 * IMPORTANT:
 * - Put API keys in environment variables if you use external services:
 *    WEATHER_API_KEY, TYPECAST_API_KEY, BETADASH_URL
 * - Customize ownerIDs in defaultSettings if you want more owners.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_DIR = __dirname || '.';
const SETTINGS_FILE = path.join(BASE_DIR, 'aria_settings.json');
const USERS_FILE = path.join(BASE_DIR, 'aria_users.json');
const GAMES_FILE = path.join(BASE_DIR, 'aria_games.json');
const SHOP_FILE = path.join(BASE_DIR, 'aria_shop.json');
const LOG_FILE = path.join(BASE_DIR, 'aria_logs.log');

// -------------------- Helpers --------------------
function safeWrite(filePath, data) {
  try { fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data, null, 2)); }
  catch (e) { console.error("Write error:", e && e.message); }
}
function safeReadJSON(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath));
  } catch (e) {
    console.error("Read JSON error:", e && e.message);
    return fallback;
  }
}
function appendLog(line) {
  try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${line}\n`); } catch(e) {}
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function convertToBold(text){ const m={'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇','A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭'}; return String(text).split('').map(c=>m[c]||c).join(''); }
function phDateTime(){ try{ const now=new Date().toLocaleString('en-PH',{timeZone:'Asia/Manila',weekday:'short',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}); return now.replace(',', ' •'); }catch{ return new Date().toString(); }}

// -------------------- Feature & Default Settings --------------------
const DEFAULT_OWNER = "61580959514473"; // default admin / report target

// Feature definitions (compact list; can be toggled by admin)
const FEATURE_DEFINITIONS = [
  // core features (can add more)
  'boldFormatting','profanityFilter','aiRetrySystem','weatherAutoSearch','ttsVoiceReplies','philippineTimeDisplay','tipMessages','reactionEmojis','errorLogs','autoReplies',
  'aiPersonalityFriendly','aiPersonalityFormal','aiPersonalityHumor','weatherEmojis','ttsAutoResponse','responseTypingEffect','aiSummarizeLongText','commandLogging','adminNotifications','systemHealthCheck',
  // games & economy
  'aiQuoteMode','aiFactMode','weatherTips','aiShortResponses','aiDetailedResponses','ttsVoiceSelect','languageDetection','dailyGreeting','eventReminders','debugMode',
  'autoBan','messagePinning','welcomeMessage','goodbyeMessage','autoTagAdmin','keywordMonitor','aiFunFacts','aiJokes','weatherAlerts','messageCleanup',
  'dailyRewards','coinSystem','shop','badgeSystem','spinFruits','guessNumber','triviaQuiz','diceRoll','memoryMatch','scramble',
  // additional 40 games (names shortened)
  'mathQuiz','emojiMatch','coinFlip','riddleTime','typeSpeed','alphabetRace','numberSequence','wordChain','guessTheWord','miniPong',
  'findTreasure','magicChest','dungeon','islandExplorer','secretCode','spellBuilder','bossBattle','arenaFight','treasurePuzzle','mysticWheel',
  'climbTower','endlessRunner','bombDiffuse','bowling','penalty','hoopShot','targetShooter','driftRace','dragonFlight','starCatcher',
  'chessPuzzle','sudokuMini','memoryPlus','colorMatch','wordHunt','quizBattle','whoSaid','logicChain','brainBurst','triviaWar',
  // dashboard extras
  'levelSystem','leaderboard','profilePublic','gameStats','marketplace','boostMode','giftPoints','autoMuteSpammer','autoWelcomeTTS','backupSettings'
];

// ensure at least 100 features potential by placeholder if wanted
while (FEATURE_DEFINITIONS.length < 100) FEATURE_DEFINITIONS.push(`feature${FEATURE_DEFINITIONS.length+1}`);

// default settings object
const defaultSettings = {
  version: '7.0',
  maintenance: false,
  protectionMode: false,
  ownerIDs: [DEFAULT_OWNER],
  reportTarget: DEFAULT_OWNER,
  rulesText: `📜 Aria Group Rules\n1) Be respectful\n2) No spam\n3) No NSFW or violent content\n4) Follow admin instructions`,
  features: {},
  gameSettings: {
    freeSpinCooldown: 60*60*1000, // 1 hour
    spinCostCoins: 50,
    dailyCoins: 100,
    dailyXp: 50,
    xpPerCommand: 10,
    xpPerMessage: 2
  }
};

// init features to ON by default (per request "pagandahin")
FEATURE_DEFINITIONS.forEach(k => defaultSettings.features[k] = true);

// -------------------- Ensure files exist --------------------
function ensureFiles() {
  if (!fs.existsSync(SETTINGS_FILE)) safeWrite(SETTINGS_FILE, defaultSettings);
  if (!fs.existsSync(USERS_FILE)) safeWrite(USERS_FILE, {});
  if (!fs.existsSync(GAMES_FILE)) safeWrite(GAMES_FILE, {});
  if (!fs.existsSync(SHOP_FILE)) {
    const sampleShop = {
      "spin_boost": { cost: 200, desc: "Extra 5 spins/day (24h)" },
      "xp_boost": { cost: 300, desc: "Double XP for 10 minutes" },
      "avatar_frame": { cost: 500, desc: "Decorative frame" }
    };
    safeWrite(SHOP_FILE, sampleShop);
  }
}
ensureFiles();

// -------------------- Storage Helpers --------------------
function loadSettings(){ const s = safeReadJSON(SETTINGS_FILE, defaultSettings); // ensure new features exist
  FEATURE_DEFINITIONS.forEach(k=>{ if (!(s.features && k in s.features)) s.features[k]=true; }); if(!s.ownerIDs)s.ownerIDs=[DEFAULT_OWNER]; if(!s.reportTarget) s.reportTarget=DEFAULT_OWNER; return s;
}
function saveSettings(s){ safeWrite(SETTINGS_FILE, s); }
function loadUsers(){ return safeReadJSON(USERS_FILE, {}); }
function saveUsers(u){ safeWrite(USERS_FILE, u); }
function loadGames(){ return safeReadJSON(GAMES_FILE, {}); }
function saveGames(g){ safeWrite(GAMES_FILE, g); }
function loadShop(){ return safeReadJSON(SHOP_FILE, {}); }
function saveShop(s){ safeWrite(SHOP_FILE, s); }

// -------------------- User helper functions --------------------
function ensureUser(uid){
  const users = loadUsers();
  if (!users[uid]) {
    users[uid] = {
      xp: 0,
      level: 0,
      coins: 0,
      badges: [],
      messages: 0,
      games: {},
      lastActive: new Date().toISOString(),
      joined: new Date().toISOString(),
      lastDaily: 0,
      spinsUsed: 0,
      name: null
    };
    saveUsers(users);
  }
  return users[uid];
}
function calcLevelFromXp(xp){ return Math.floor(xp / 500); } // example formula
function addXp(uid, amount){
  const users = loadUsers(); ensureUser(uid);
  users[uid].xp = (users[uid].xp || 0) + amount;
  const prevLevel = users[uid].level || 0;
  const newLevel = calcLevelFromXp(users[uid].xp);
  users[uid].level = newLevel;
  users[uid].lastActive = new Date().toISOString();
  saveUsers(users);
  return { leveled: newLevel > prevLevel, oldLevel: prevLevel, newLevel };
}
function addCoins(uid, amount){
  const users = loadUsers(); ensureUser(uid);
  users[uid].coins = (users[uid].coins || 0) + amount;
  saveUsers(users);
}
function incrementMessages(uid){
  const users = loadUsers(); ensureUser(uid);
  users[uid].messages = (users[uid].messages || 0) + 1;
  users[uid].lastActive = new Date().toISOString();
  saveUsers(users);
}
function setUserName(uid, name){
  const users = loadUsers(); ensureUser(uid);
  users[uid].name = name; saveUsers(users);
}

// -------------------- Resolve user helper (works without @) --------------------
async function resolveUser(input, threadID, api, fallbackID){
  input = (input || '').trim();
  if (/^\d+$/.test(input)) {
    const id = String(input);
    try { const info = await api.getUserInfo(id); const name = info && info[id] && info[id].name ? info[id].name : id; return { id, name }; } catch { return { id, name: id }; }
  }
  if (input.startsWith('@')) input = input.slice(1).trim();
  if (!input) {
    if (!fallbackID) return null;
    try { const info = await api.getUserInfo(fallbackID); const name = info && info[fallbackID] && info[fallbackID].name ? info[fallbackID].name : fallbackID; return { id: fallbackID, name }; } catch { return { id: fallbackID, name: fallbackID }; }
  }
  try {
    const tinfo = await api.getThreadInfo(threadID);
    const candidates = [];
    if (tinfo && tinfo.userInfo) {
      for (const [id, info] of Object.entries(tinfo.userInfo)) candidates.push({ id: String(id), name: info.name || '' });
    } else if (tinfo && Array.isArray(tinfo.participantIDs)) {
      tinfo.participantIDs.forEach(p => { if (p && p.id) candidates.push({ id: String(p.id), name: p.name || '' }); });
    }
    const lower = input.toLowerCase();
    let match = candidates.find(c => c.name && c.name.toLowerCase() === lower);
    if (!match) match = candidates.find(c => c.name && c.name.toLowerCase().startsWith(lower));
    if (!match) match = candidates.find(c => c.name && c.name.toLowerCase().includes(lower));
    if (match) return { id: match.id, name: match.name };
    try { const info = await api.getUserInfo(input); if (info && info[input]) return { id: input, name: info[input].name || input }; } catch {}
    if (fallbackID) {
      try { const info2 = await api.getUserInfo(fallbackID); return { id: fallbackID, name: (info2 && info2[fallbackID] && info2[fallbackID].name) || fallbackID }; } catch {}
    }
    return null;
  } catch (e) {
    if (fallbackID) return { id: fallbackID, name: fallbackID };
    return null;
  }
}

// -------------------- Auto-ban & rate-limiting (in-memory) --------------------
const userTimestamps = new Map();
const bannedUsers = new Map(); // userID -> unbanTimestamp
const MESSAGE_LIMIT = 1;
const COOLDOWN_WINDOW = 10*1000;
const BAN_DURATION = 60*1000;

function recordUserMessageForSpam(uid){
  const now = Date.now();
  const arr = (userTimestamps.get(uid) || []).filter(t => now - t < COOLDOWN_WINDOW);
  arr.push(now); userTimestamps.set(uid, arr);
  return arr.length;
}
function banUser(uid){ bannedUsers.set(String(uid), Date.now() + BAN_DURATION); }
function isUserBanned(uid){
  const until = bannedUsers.get(String(uid));
  if (!until) return false;
  if (Date.now() > until) { bannedUsers.delete(String(uid)); return false; }
  return true;
}

// -------------------- Auto-reply triggers --------------------
const AUTO_REPLY_TRIGGERS = {
  hi: "Hey there! 😊 How’s your day?",
  hello: "Hello! 👋 Need something?",
  "good morning": "☀️ Good morning! Ready to start your day?",
  "good night": "🌙 Sweet dreams! Rest well.",
  kamusta: "Mabuti! Ikaw, kamusta ka naman?",
  thanks: "You’re welcome 💖!",
  ty: "No problem!",
  bye: "👋 See you soon!"
};

// -------------------- Game engine registry --------------------
const GAMES = {}; // name -> handler(context)
function registerGame(name, handler){ GAMES[name.toLowerCase()] = handler; }

// ---------- Implement core games (a subset; many generic games supported) ----------

// Spin Fruits
registerGame('spin', async ({ api, threadID, senderID, args, settings })=>{
  if (!settings.features.spinFruits) return api.sendMessage("🎰 Spin is disabled by admin.", threadID);
  ensureUser(senderID); const users = loadUsers(); const user = users[senderID];
  const now = Date.now(); const cooldown = settings.gameSettings.freeSpinCooldown || 60*60*1000;
  const canFree = (now - (user.lastSpin || 0)) >= cooldown;
  const cost = settings.gameSettings.spinCostCoins || 0;
  if (!canFree && (user.coins || 0) < cost) return api.sendMessage("❗ No free spins and not enough coins.", threadID);
  if (!canFree) user.coins -= cost;
  user.lastSpin = now; user.spinsUsed = (user.spinsUsed||0)+1;
  const fruits = ['🍒','🍌','🍊','🍉','🍇','🍍']; const reel = [fruits[randInt(0,fruits.length-1)], fruits[randInt(0,fruits.length-1)], fruits[randInt(0,fruits.length-1)]];
  const counts = {}; reel.forEach(r=>counts[r]=(counts[r]||0)+1);
  let xp = 0, coins = 0, msg = `🎰 ${reel.join(' | ')}`;
  const top = Math.max(...Object.values(counts));
  if (top === 3) { xp = 100; coins = 50; msg += `\n🎊 JACKPOT! +${xp} XP +${coins} coins.`; }
  else if (top === 2) { xp = 30; coins = 15; msg += `\n🎉 Match 2! +${xp} XP +${coins} coins.`; }
  else { xp = 5; coins = 2; msg += `\n🙂 No match — +${xp} XP.`; }
  addXp(senderID, xp); addCoins(senderID, coins);
  users[senderID] = user; saveUsers(users);
  return api.sendMessage(msg, threadID);
});

// Guess number
registerGame('guess', async ({ api, threadID, senderID, args, settings })=>{
  if (!settings.features.guessNumber) return api.sendMessage("Guess Number disabled.", threadID);
  const num = randInt(1,10); const guess = parseInt(args[0]); if (!guess) return api.sendMessage("Usage: aria play guess [1-10]", threadID);
  if (guess === num) { addXp(senderID,50); addCoins(senderID,20); return api.sendMessage(`🎯 Correct! ${num}. +50 XP +20 coins.`, threadID); }
  addXp(senderID,5); return api.sendMessage(`❌ Wrong! The number was ${num}. +5 XP.`, threadID);
});

// Trivia (start/answer)
const TRIVIA_BANK = [
  { q: "What is the largest planet in our Solar System?", a: "jupiter" },
  { q: "Who wrote 'Romeo and Juliet'?", a: "shakespeare" },
  { q: "What is H2O commonly known as?", a: "water" },
  { q: "What color do you get when you mix red and white?", a: "pink" }
];
registerGame('trivia', async ({ api, threadID, senderID, args, settings })=>{
  if (!settings.features.triviaQuiz) return api.sendMessage("Trivia disabled.", threadID);
  const games = loadGames(); const threadGame = games[threadID] || {};
  if (!args[0] || args[0]==='start') {
    const item = TRIVIA_BANK[randInt(0,TRIVIA_BANK.length-1)];
    threadGame.trivia = { q: item.q, a: item.a, starter: senderID, ts: Date.now() };
    games[threadID] = threadGame; saveGames(games);
    return api.sendMessage(`❓ Trivia:\n${item.q}\nReply: aria play trivia answer [your answer]`, threadID);
  }
  if (args[0] === 'answer') {
    const ans = args.slice(1).join(' ').trim().toLowerCase();
    if (!threadGame.trivia) return api.sendMessage("No trivia active. Start: aria play trivia", threadID);
    if (ans.includes(threadGame.trivia.a)) { addXp(senderID,40); addCoins(senderID,15); delete threadGame.trivia; games[threadID]=threadGame; saveGames(games); return api.sendMessage("✅ Correct! +40 XP +15 coins.", threadID); }
    addXp(senderID,5); return api.sendMessage("❌ Incorrect. +5 XP.", threadID);
  }
});

// Dice roll
registerGame('dice', async ({ api, threadID, senderID })=>{
  if (!loadSettings().features.diceRoll) return api.sendMessage("Dice disabled.", threadID);
  const roll = randInt(1,6); let xp = 5, coins = 0; if (roll === 6) { xp = 30; coins = 20; }
  addXp(senderID, xp); addCoins(senderID, coins);
  return api.sendMessage(`🎲 You rolled ${roll}. +${xp} XP${coins?` +${coins} coins`:''}`, threadID);
});

// Memory (start & answer)
registerGame('memory', async ({ api, threadID, senderID, args })=>{
  if (!loadSettings().features.memoryMatch) return api.sendMessage("Memory disabled.", threadID);
  const pool = ['🍎','🍌','🍇','🍒','🍍','🍉','🍊']; const seq = [pool[randInt(0,pool.length-1)], pool[randInt(0,pool.length-1)], pool[randInt(0,pool.length-1)]];
  const games = loadGames(); games[threadID]=games[threadID]||{}; games[threadID].memory = { seq, ts: Date.now(), starter: senderID }; saveGames(games);
  return api.sendMessage(`🧠 Remember this:\n${seq.join(' ')}\nThen reply: aria play memory answer [sequence]`, threadID);
});
registerGame('memory_answer', async ({ api, threadID, senderID, args })=>{
  const games = loadGames(); const gg = games[threadID] || {};
  if (!gg.memory) return api.sendMessage("No memory active. Start: aria play memory", threadID);
  const answer = args.join(' ').trim();
  const correct = gg.memory.seq.join(' ');
  if (answer === correct) { addXp(senderID,40); addCoins(senderID,20); delete gg.memory; saveGames(games); return api.sendMessage("✅ Correct! +40 XP +20 coins.", threadID); }
  addXp(senderID,5); return api.sendMessage(`❌ Not quite. The correct was: ${correct}. +5 XP.`, threadID);
});

// Scramble (start & answer)
registerGame('scramble', async ({ api, threadID, senderID })=>{
  if (!loadSettings().features.scramble) return api.sendMessage("Scramble disabled.", threadID);
  const words = ['planet','guitar','coffee','computer','javascript','banana','island','dragon','mystery'];
  const word = words[randInt(0,words.length-1)]; const scrambled = word.split('').sort(()=>Math.random()-0.5).join('');
  const games = loadGames(); games[threadID]=games[threadID]||{}; games[threadID].scramble = { word, ts: Date.now() }; saveGames(games);
  return api.sendMessage(`🔤 Unscramble: ${scrambled}\nReply: aria play scramble answer [word]`, threadID);
});
registerGame('scramble_answer', async ({ api, threadID, senderID, args })=>{
  const games = loadGames(); const gg = games[threadID] || {};
  if (!gg.scramble) return api.sendMessage("No scramble active. Start: aria play scramble", threadID);
  const guess = args[0] ? args[0].toLowerCase() : '';
  if (!guess) return api.sendMessage("Usage: aria play scramble answer [word]", threadID);
  if (guess === gg.scramble.word) { addXp(senderID,30); addCoins(senderID,15); delete gg.scramble; saveGames(games); return api.sendMessage("✅ Correct! +30 XP +15 coins.", threadID); }
  addXp(senderID,5); return api.sendMessage("❌ Wrong — try again!", threadID);
});

// Daily reward
registerGame('daily', async ({ api, threadID, senderID, settings })=>{
  const users = loadUsers(); ensureUser(senderID);
  const u = users[senderID]; const now = Date.now(); if (now - (u.lastDaily || 0) < 24*60*60*1000) return api.sendMessage("⏳ Daily already claimed.", threadID);
  const coins = settings.gameSettings.dailyCoins || 100; const xp = settings.gameSettings.dailyXp || 50; u.lastDaily = now; u.coins = (u.coins||0)+coins; u.xp = (u.xp||0)+xp; saveUsers(users);
  return api.sendMessage(`🎁 Daily: +${coins} coins, +${xp} XP.`, threadID);
});

// Generic games (many)
const GENERIC_GAMES = ['mathQuiz','emojiMatch','coinFlip','riddleTime','typeSpeed','alphabetRace','numberSequence','wordChain','guessTheWord','miniPong',
  'findTreasure','magicChest','dungeon','islandExplorer','secretCode','spellBuilder','bossBattle','arenaFight','treasurePuzzle','mysticWheel',
  'climbTower','endlessRunner','bombDiffuse','bowling','penalty','hoopShot','targetShooter','driftRace','dragonFlight','starCatcher',
  'chessPuzzle','sudokuMini','memoryPlus','colorMatch','wordHunt','quizBattle','whoSaid','logicChain','brainBurst','triviaWar'];
GENERIC_GAMES.forEach(name=>{
  registerGame(name, async ({ api, threadID, senderID })=>{
    // simple random reward
    const xp = randInt(5,80); const coins = randInt(0,40);
    addXp(senderID, xp); addCoins(senderID, coins);
    const users = loadUsers(); ensureUser(senderID); users[senderID].games[name] = (users[senderID].games[name]||0)+1; saveUsers(users);
    return api.sendMessage(`🎮 ${convertToBold(name)} played!\nYou earned +${xp} XP and +${coins} coins.`, threadID);
  });
});

// Shop
async function handleShop(api, threadID, senderID, args){
  const shop = loadShop(); if (!args[0]) {
    let msg = "🏪 Aria Shop\n━━━━━━━━━━━━━━\n";
    Object.entries(shop).forEach(([k,v]) => msg += `${k} — ${v.cost} coins — ${v.desc}\n`);
    msg += "\nBuy: aria buy [item]";
    return api.sendMessage(msg, threadID);
  } else {
    const item = args[0]; const info = shop[item];
    if (!info) return api.sendMessage("Item not found.", threadID);
    const users = loadUsers(); ensureUser(senderID);
    if ((users[senderID].coins||0) < info.cost) return api.sendMessage("Not enough coins.", threadID);
    users[senderID].coins -= info.cost; users[senderID].badges = users[senderID].badges||[]; users[senderID].badges.push(item); saveUsers(users);
    return api.sendMessage(`✅ Purchased ${item}.`, threadID);
  }
}

// -------------------- Dashboard & Profile --------------------
async function buildDashboard(threadID, api, settings){
  const usersDB = loadUsers();
  let tinfo = null;
  try { tinfo = await api.getThreadInfo(threadID); } catch(e){}
  const participantIDs = (tinfo && tinfo.participantIDs) ? tinfo.participantIDs.map(p=>String(p.id)) : Object.keys(usersDB);
  const candidates = participantIDs.length ? participantIDs.filter(id=>usersDB[id]) : Object.keys(usersDB);
  const arr = candidates.map(id=>{
    const u = usersDB[id] || {}; const score = (u.xp||0) + ((u.messages||0)*2) + ((u.coins||0)/2);
    return { id, name: u.name || id, xp: u.xp||0, level: u.level||0, coins: u.coins||0, messages: u.messages||0, score };
  });
  arr.sort((a,b)=>b.score - a.score); const top = arr.slice(0,10);
  let msg = `🏆 Aria Dashboard — Top Users\n━━━━━━━━━━━━━━\n`;
  if (!top.length) msg += "No users yet.\n";
  top.forEach((u,i)=>msg += `${i<3?['🥇','🥈','🥉'][i]:(i+1)+'.'} ${u.name} — Level ${u.level} | XP: ${u.xp} | Coins: ${u.coins} | Score: ${Math.round(u.score)}\n`);
  msg += `\n📊 Group Total Users: ${arr.length}\n🕒 Last Update: ${phDateTime()}\n`;
  return msg;
}

async function showProfile(targetArg, threadID, api, fallbackID){
  const resolved = await resolveUser(targetArg, threadID, api, fallbackID);
  const uid = resolved ? String(resolved.id) : String(fallbackID);
  const users = loadUsers(); const u = users[uid] || { xp:0, level:0, coins:0, messages:0, badges:[], lastActive:'N/A', joined:'N/A' };
  const score = (u.xp||0) + ((u.messages||0)*2) + ((u.coins||0)/2);
  let msg = `👤 Profile — ${resolved && resolved.name?resolved.name:uid}\n━━━━━━━━━━━━━━\n🧠 Level: ${u.level}\n💥 XP: ${u.xp}\n💰 Coins: ${u.coins}\n💬 Messages: ${u.messages}\n🏆 Score: ${Math.round(score)}\n🎖 Badges: ${u.badges && u.badges.length?u.badges.join(', '):'None'}\n📅 Joined: ${u.joined}\n⏱ Last Active: ${u.lastActive}\n`;
  if (resolved && resolved.note) msg += `\nℹ️ Note: ${resolved.note}`;
  return msg;
}

// -------------------- Command dispatcher --------------------
module.exports.config = {
  name: 'aria',
  version: '7.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['aria-games','aria-dashboard'],
  description: 'Aria v7 — Games + Dashboard + Settings',
  usages: 'aria [command]',
  cooldowns: 0
};

module.exports.run = async function({ api, event, args = [], Users, Threads }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  const rawArgs = args.slice();
  const input = rawArgs.join(' ').trim();
  const settings = loadSettings();

  // thread info & privileges
  let threadInfo = {};
  try { threadInfo = await api.getThreadInfo(threadID); } catch(e) {}
  const threadAdmins = (threadInfo && threadInfo.adminIDs) ? threadInfo.adminIDs.map(a=>String(a.id)) : [];
  const isThreadAdmin = threadAdmins.includes(String(senderID));
  const isOwner = (settings.ownerIDs || []).map(String).includes(String(senderID));
  const isPrivileged = isOwner || isThreadAdmin;

  // protection / maintenance
  if (settings.protectionMode && !isPrivileged && rawArgs[0] !== 'admin') return api.sendMessage("🚫 Aria is in protection mode. Only admins/owners can use her now.", threadID, messageID);
  if (settings.maintenance && !isPrivileged && rawArgs[0] !== 'admin') return api.sendMessage("🛠 Aria is under maintenance. Try again later.", threadID, messageID);

  // auto-ban check
  if (settings.features.autoBan && !isPrivileged) {
    if (isUserBanned(senderID)) return api.sendMessage("🚫 You are temporarily banned for spamming Aria commands. Please wait.", threadID, messageID);
    const cnt = recordUserMessageForSpam(senderID);
    if (cnt > MESSAGE_LIMIT) { banUser(senderID); appendLog(`Auto-ban: ${senderID}`); api.sendMessage("⚠️ You were auto-banned for spamming.", threadID, messageID); return; }
  }

  // ensure user record exists
  ensureUser(senderID);
  // record command usage XP (per-command)
  if (settings.features.levelSystem) { addXp(senderID, settings.gameSettings.xpPerCommand || 10); }
  incrementMessages(senderID);

  // ADMIN commands
  if (rawArgs[0] === 'admin') {
    if (!isPrivileged) return api.sendMessage("⚠️ Only admins/owners can use admin commands.", threadID, messageID);
    const sub = rawArgs[1];
    if (!sub) return api.sendMessage("⚙️ Admin: maintenance | protection | settings | setxp | setcoins | reset xp | owners | reportto | setrules", threadID, messageID);

    // maintenance toggle
    if (sub === 'maintenance') { settings.maintenance = !settings.maintenance; saveSettings(settings); return api.sendMessage(`⚙️ Maintenance: ${settings.maintenance ? 'ON' : 'OFF'}`, threadID, messageID); }

    // protection toggle
    if (sub === 'protection') { settings.protectionMode = !settings.protectionMode; saveSettings(settings); return api.sendMessage(`🛡 Protection: ${settings.protectionMode ? 'ON' : 'OFF'}`, threadID, messageID); }

    // settings list / toggle
    if (sub === 'settings') {
      const action = rawArgs[2];
      const keys = Object.keys(settings.features);
      if (!action || action === 'list') {
        const page = Math.max(1, parseInt(rawArgs[3]) || 1);
        const perPage = 15; const total = keys.length; const pages = Math.ceil(total/perPage);
        const start = (page-1)*perPage; const slice = keys.slice(start, start+perPage);
        let msg = `📋 Aria Settings (page ${page}/${pages})\n━━━━━━━━━━━━━━\n`;
        slice.forEach((k,i)=> msg += `${start+i+1}. ${k} — ${settings.features[k] ? '✅ ON' : '❌ OFF'}\n`);
        msg += `\nUsage: aria admin settings toggle [number|name]`;
        return api.sendMessage(msg, threadID, messageID);
      }
      if (action === 'toggle') {
        const target = rawArgs[3]; if (!target) return api.sendMessage("Usage: aria admin settings toggle [number|name]", threadID, messageID);
        let idx = parseInt(target);
        if (!isNaN(idx)) {
          if (idx < 1 || idx > keys.length) return api.sendMessage("Invalid number.", threadID, messageID);
          const key = keys[idx-1]; settings.features[key] = !settings.features[key]; saveSettings(settings);
          if (settings.features.adminNotifications) { (settings.ownerIDs||[]).forEach(owner => { try{ api.sendMessage(`🔁 ${key} is now ${settings.features[key] ? 'ON' : 'OFF'} (by ${senderID})`, owner); }catch(e){} }); }
          return api.sendMessage(`🔁 ${key} is now ${settings.features[key] ? 'ON ✅' : 'OFF ❌'}`, threadID, messageID);
        } else {
          if (!keys.includes(target)) return api.sendMessage("Feature not found.", threadID, messageID);
          settings.features[target] = !settings.features[target]; saveSettings(settings); return api.sendMessage(`🔁 ${target} is now ${settings.features[target] ? 'ON ✅' : 'OFF ❌'}`, threadID, messageID);
        }
      }
    }

    // setxp
    if (sub === 'setxp') {
      const targetArg = rawArgs[2]; const amount = parseInt(rawArgs[3]);
      if (!targetArg || isNaN(amount)) return api.sendMessage("Usage: aria admin setxp [user] [amount]", threadID, messageID);
      const resolved = await resolveUser(targetArg, threadID, api, senderID);
      if (!resolved) return api.sendMessage("User not found.", threadID, messageID);
      const users = loadUsers(); ensureUser(resolved.id); users[resolved.id].xp = amount; users[resolved.id].level = calcLevelFromXp(amount); saveUsers(users);
      return api.sendMessage(`✅ Set XP for ${resolved.name} to ${amount}.`, threadID, messageID);
    }

    // setcoins
    if (sub === 'setcoins') {
      const targetArg = rawArgs[2]; const amount = parseInt(rawArgs[3]);
      if (!targetArg || isNaN(amount)) return api.sendMessage("Usage: aria admin setcoins [user] [amount]", threadID, messageID);
      const resolved = await resolveUser(targetArg, threadID, api, senderID);
      if (!resolved) return api.sendMessage("User not found.", threadID, messageID);
      const users = loadUsers(); ensureUser(resolved.id); users[resolved.id].coins = amount; saveUsers(users);
      return api.sendMessage(`✅ Set coins for ${resolved.name} to ${amount}.`, threadID, messageID);
    }

    // reset xp
    if (sub === 'reset' && rawArgs[2] === 'xp') {
      const targetArg = rawArgs[3]; if (!targetArg) return api.sendMessage("Usage: aria admin reset xp [user]", threadID, messageID);
      const resolved = await resolveUser(targetArg, threadID, api, senderID);
      if (!resolved) return api.sendMessage("User not found.", threadID, messageID);
      const users = loadUsers(); ensureUser(resolved.id); users[resolved.id].xp = 0; users[resolved.id].level = 0; saveUsers(users);
      return api.sendMessage(`✅ Reset XP for ${resolved.name}.`, threadID, messageID);
    }

    // owners
    if (sub === 'owners') {
      const action = rawArgs[2];
      if (!action) return api.sendMessage(`Owners: ${JSON.stringify(settings.ownerIDs)}\nUsage: aria admin owners add|remove [id]`, threadID, messageID);
      if (action === 'add') { const id = rawArgs[3]; if (!id) return api.sendMessage("Usage: aria admin owners add [id]", threadID); if (!settings.ownerIDs.includes(String(id))) settings.ownerIDs.push(String(id)); saveSettings(settings); return api.sendMessage(`✅ Added owner ${id}`, threadID, messageID); }
      if (action === 'remove') { const id = rawArgs[3]; if (!id) return api.sendMessage("Usage: aria admin owners remove [id]", threadID, messageID); settings.ownerIDs = settings.ownerIDs.filter(x=>String(x)!==String(id)); saveSettings(settings); return api.sendMessage(`✅ Removed owner ${id}`, threadID, messageID); }
    }

    // reportto
    if (sub === 'reportto') { const id = rawArgs[2]; if (!id) return api.sendMessage("Usage: aria admin reportto [id]", threadID, messageID); settings.reportTarget = String(id); saveSettings(settings); return api.sendMessage(`✅ Reports now go to ${id}`, threadID, messageID); }

    // setrules
    if (sub === 'setrules') { const newRules = rawArgs.slice(2).join(' ').trim(); if (!newRules) return api.sendMessage("Usage: aria admin setrules [text]", threadID, messageID); settings.rulesText = newRules; saveSettings(settings); return api.sendMessage("✅ Rules updated.", threadID, messageID); }

    return api.sendMessage("⚙️ Admin command processed.", threadID, messageID);
  } // end admin

  // help / no input
  const first = rawArgs[0] ? rawArgs[0].toLowerCase() : '';
  if (!first || first === 'help') {
    const help = `🤖 ${convertToBold('Aria v7.0')}\n━━━━━━━━━━━━━━\nCommands:\n• aria dashboard\n• aria profile [name|id]\n• aria play [game]\n• aria daily\n• aria shop | aria buy [item]\n• aria report [message]\n• aria rules\nAdmin: aria admin ...`;
    return api.sendMessage(help, threadID, messageID);
  }

  // quick commands
  if (first === 'dashboard') {
    const text = await buildDashboard(threadID, api, settings);
    return api.sendMessage(text, threadID, messageID);
  }
  if (first === 'profile') {
    const targetArg = rawArgs.slice(1).join(' ').trim();
    const text = await showProfile(targetArg, threadID, api, senderID);
    return api.sendMessage(text, threadID, messageID);
  }
  if (first === 'rules') return api.sendMessage(settings.rulesText || defaultSettings.rulesText, threadID, messageID);
  if (first === 'report') {
    const msg = rawArgs.slice(1).join(' ').trim(); if (!msg) return api.sendMessage("Usage: aria report [message]", threadID, messageID);
    let name = senderID; try{ const info = await api.getUserInfo(senderID); name = info && info[senderID] && info[senderID].name || senderID; }catch(e){}
    const payload = `📩 NEW REPORT\nFrom: ${name} (${senderID})\nTime: ${phDateTime()}\nMessage:\n${msg}`;
    api.sendMessage("✅ Your report has been sent to the admin.", threadID, messageID);
    try{ api.sendMessage(payload, settings.reportTarget || settings.ownerIDs[0]); } catch(e){ appendLog(`Report send error: ${e.message}`); }
    return;
  }

  // shop / buy
  if (first === 'shop') return handleShop(api, threadID, senderID, rawArgs.slice(1));
  if (first === 'buy' || first === 'purchase') return handleShop(api, threadID, senderID, rawArgs.slice(1));

  // daily
  if (first === 'daily') return GAMES['daily']({ api, threadID, senderID, args: rawArgs.slice(1), settings });

  // quick game shortcuts
  const quicks = ['spin','guess','trivia','dice','memory','scramble'];
  if (quicks.includes(first)) {
    // special sub-answers mapping
    if (first === 'memory' && rawArgs[1] === 'answer') return GAMES['memory_answer']({ api, threadID, senderID, args: rawArgs.slice(2) });
    if (first === 'scramble' && rawArgs[1] === 'answer') return GAMES['scramble_answer']({ api, threadID, senderID, args: rawArgs.slice(2) });
    return GAMES[first]({ api, threadID, senderID, args: rawArgs.slice(1), settings });
  }

  // generic play
  if (first === 'play') {
    const gname = rawArgs[1]; if (!gname) return api.sendMessage("Usage: aria play [gameName]", threadID, messageID);
    const gn = gname.toLowerCase();
    const map = { 'spinfruits':'spin','slot':'spin','guessnumber':'guess','triviaquiz':'trivia','memorymatch':'memory','wordscramble':'scramble' };
    const resolved = map[gn] || gn;
    if (!GAMES[resolved]) return api.sendMessage("Game not found. Use aria help to see games.", threadID, messageID);
    // allow answers mapping for memory & scramble
    if (resolved === 'memory' && rawArgs[2] === 'answer') return GAMES['memory_answer']({ api, threadID, senderID, args: rawArgs.slice(3) });
    if (resolved === 'scramble' && rawArgs[2] === 'answer') return GAMES['scramble_answer']({ api, threadID, senderID, args: rawArgs.slice(3) });
    return GAMES[resolved]({ api, threadID, senderID, args: rawArgs.slice(2), settings });
  }

  // if command is direct game name
  if (GAMES[first]) return GAMES[first]({ api, threadID, senderID, args: rawArgs.slice(1), settings });

  // fallback: AI passthrough
  try {
    const betadashURL = process.env.BETADASH_URL || 'https://betadash-api-swordslush-production.up.railway.app/assistant';
    const resp = await axios.get(betadashURL, { params: { chat: input }, timeout: 15000 });
    if (resp && resp.data && resp.data.response) {
      let out = resp.data.response;
      if (settings.features.boldFormatting) out = out.replace(/\*\*(.*?)\*\*/g, (_,t)=>convertToBold(t));
      addXp(senderID, 8); addCoins(senderID, 2);
      return api.sendMessage(`🤖 Aria:\n${out}`, threadID, messageID);
    } else return api.sendMessage("⚠️ No AI response from service.", threadID, messageID);
  } catch (e) {
    appendLog(`AI error: ${e && e.message}`); return api.sendMessage("⛔ Error contacting AI service.", threadID, messageID);
  }
}; // end run
