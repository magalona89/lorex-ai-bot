/**
 * ai.js
 * GPT-5 PRO ULTRA — Single-file implementation
 * Features: settings, control panel, adaptive buttons, auto-react, sendnoti, report, rules, admininfo
 *
 * Requirements: axios, fs, path
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "gpt5pro_config.json");
const MEMORY_FILE = path.join(__dirname, "gpt5pro_memory.json");
const REPORT_LOG = path.join(__dirname, "ai_reports.json");
const USER_LOG = path.join(__dirname, "ai_userlog.json");

const DEFAULT_API = "https://daikyu-apizer-108.up.railway.app/api/gpt-5";
const API_TIMEOUT = 25000;
const MAX_RETRIES = 2;
const CHUNK_SIZE = 1800;
const MEMORY_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

/* ---------------- Helpers: load/save ---------------- */

function ensureFile(file, defaultContent) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultContent, null, 2));
  }
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig = {
      maintenance: false,
      admins: [], // put admin numeric FBIDs here
      admin_profile_url: "https://www.facebook.com/manuelson.267543",
      api_url: DEFAULT_API,
      pro_mode: true,
      settings: {
        auto_react: true,
        ai_buttons: true,
        adaptive_buttons: true,
        auto_summarize: true,
        context_memory: true,
        style_tone: "friendly", // could be 'friendly','formal','funny'
        fast_mode: false,
        deep_mode: true,
        auto_translate: false,
        ai_safety_filter: true
      }
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (e) {
    // fallback
    const fallback = { maintenance: false, admins: [], api_url: DEFAULT_API, pro_mode: true, settings: {} };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

function saveConfig(c) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2));
}

function loadMemory() {
  ensureFile(MEMORY_FILE, {});
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveMemory(m) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(m, null, 2));
}

function loadReports() {
  ensureFile(REPORT_LOG, []);
  try {
    return JSON.parse(fs.readFileSync(REPORT_LOG, "utf-8"));
  } catch { return []; }
}
function saveReports(r) { fs.writeFileSync(REPORT_LOG, JSON.stringify(r, null, 2)); }

function loadUserLog() {
  ensureFile(USER_LOG, []);
  try { return JSON.parse(fs.readFileSync(USER_LOG, "utf-8")); } catch { return []; }
}
function saveUserLog(u) { fs.writeFileSync(USER_LOG, JSON.stringify(u, null, 2)); }

/* ---------------- Utilities ---------------- */

function splitMessage(text, max = CHUNK_SIZE) {
  const lines = text.split("\n");
  const chunks = [];
  let buf = "";
  for (const l of lines) {
    if ((buf + "\n" + l).length > max) {
      chunks.push(buf);
      buf = l;
    } else buf += (buf ? "\n" : "") + l;
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function convertToBold(text) {
  const map = {/* same map as before - small subset used here for brevity */};
  // simple bold fallback: wrap with ** (some messengers render it)
  return `**${text}**`;
}

const REACT_EMOJIS = "😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😙😚☺🙂🤗😇🤠🤡🤥🤓🤔😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔🤑😷🤕🤧😞💀👻💩😻😻😿".split("");

/* ---------------- Adaptive Button Helper ---------------- */

function getAdaptiveButtons(query) {
  const q = (query || "").toLowerCase();
  if (q.includes("translate")) {
    return [
      { type: "postback", title: "🌎 Translate More", payload: `gpt5 translate_more ${encodeURIComponent(query)}` },
      { type: "postback", title: "🔄 Rephrase", payload: `gpt5 rephrase ${encodeURIComponent(query)}` },
      { type: "postback", title: "📚 Explain Words", payload: `gpt5 explain ${encodeURIComponent(query)}` },
    ];
  }
  if (q.includes("summarize") || q.includes("summary")) {
    return [
      { type: "postback", title: "💡 Expand Summary", payload: `gpt5 expand ${encodeURIComponent(query)}` },
      { type: "postback", title: "🧠 Key Points", payload: `gpt5 points ${encodeURIComponent(query)}` },
      { type: "postback", title: "📖 Full Explanation", payload: `gpt5 explain ${encodeURIComponent(query)}` },
    ];
  }
  if (q.includes("image") || q.includes("photo") || q.includes("analyze")) {
    return [
      { type: "postback", title: "🔍 Describe More", payload: `gpt5 describe ${encodeURIComponent(query)}` },
      { type: "postback", title: "🎨 Analyze Style", payload: `gpt5 style ${encodeURIComponent(query)}` },
      { type: "postback", title: "🧩 Objects Detected", payload: `gpt5 detect ${encodeURIComponent(query)}` },
    ];
  }
  // default buttons
  return [
    { type: "postback", title: "🧠 Explain More", payload: `gpt5 more ${encodeURIComponent(query)}` },
    { type: "postback", title: "💡 Summarize", payload: `gpt5 summarize ${encodeURIComponent(query)}` },
    { type: "postback", title: "🔁 Regenerate", payload: `gpt5 regen ${encodeURIComponent(query)}` },
  ];
}

/* ---------------- Auto-report helpers ---------------- */

async function sendReportToAdmins(api, config, title, details) {
  const admins = config.admins || [];
  if (!admins.length) return;
  const text = `🚨 *AI REPORT*\nEvent: ${title}\nDetails: ${details}\nTime: ${new Date().toLocaleString()}`;
  for (const admin of admins) {
    try {
      // sendMessage may accept (message, threadID)
      await api.sendMessage(text, admin);
    } catch (e) {
      console.error("Failed to send report to admin:", admin, e?.message || e);
    }
  }
  // log
  const reports = loadReports();
  reports.push({ title, details, time: Date.now() });
  saveReports(reports);
}

/* ---------------- Spam tracker ---------------- */

const userSpamTracker = {}; // runtime only

async function autoDetectAndReport({ api, event, ask, config }) {
  try {
    const sender = event.senderID;
    const now = Date.now();
    if (!userSpamTracker[sender]) userSpamTracker[sender] = [];
    userSpamTracker[sender].push(now);
    // keep last 5 in window
    userSpamTracker[sender] = userSpamTracker[sender].filter(t => now - t < 10000);
    if (userSpamTracker[sender].length >= 5) {
      await sendReportToAdmins(api, config, "Spam Detected", `User ${sender} sent ${userSpamTracker[sender].length} messages in <10s`);
      delete userSpamTracker[sender];
    }
  } catch (e) {
    console.error("autoDetectAndReport error:", e?.message || e);
  }
}

/* ---------------- Exports: module config ---------------- */

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["gpt5", "gpt5-pro", "gem-pro"],
  description: "GPT-5 PRO ULTRA (all-in-one)",
  usages: "gpt5 [message] | gpt5 settings | gpt5 control | gpt5 rules | gpt5 sendnoti <msg> | gpt5 report <msg>",
  credits: "Enhanced by ChatGPT",
  cooldowns: 0
};

/* ---------------- Main run function ---------------- */

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;
  // senderName may or may not be provided by framework
  const senderName = event.senderName || "Unknown";

  const config = loadConfig();
  const memory = loadMemory();

  const admins = config.admins.length ? config.admins : [senderID];
  const isAdmin = admins.includes(senderID);

  const cmd = (args[0] || "").toLowerCase();

  // Ensure user log and auto-send rules to first-time thread (optional)
  const userLog = loadUserLog();
  if (!userLog.includes(threadID)) {
    // send rules automatically first time
    await sendAiRulesIfConfigured(api, threadID, config);
    userLog.push(threadID);
    saveUserLog(userLog);
  }

  /* ---------------- Command: settings (view/modify) ---------------- */
  if (cmd === "settings") {
    // show settings or modify
    if (args.length === 1) {
      const entries = Object.entries(config.settings)
        .map(([k, v]) => `• ${k}: ${typeof v === "boolean" ? (v ? "✅ ON" : "❌ OFF") : v}`)
        .join("\n");
      return api.sendMessage(`⚙️ GPT-5 PRO Settings:\n\n${entries}\n\nTo change: gpt5 settings <name> <on/off or value>`, threadID, messageID);
    }
    // modify
    const name = args[1];
    const val = args[2];
    if (!Object.prototype.hasOwnProperty.call(config.settings, name)) {
      return api.sendMessage("⚠️ Unknown setting name.", threadID, messageID);
    }
    // boolean on/off
    if (val === "on" || val === "off") {
      config.settings[name] = val === "on";
    } else {
      // for non-boolean settable values (eg style_tone)
      config.settings[name] = isNaN(val) ? val : JSON.parse(val);
    }
    saveConfig(config);
    return api.sendMessage(`✅ Setting updated: ${name} → ${config.settings[name]}`, threadID, messageID);
  }

  /* ---------------- Command: control (open control panel) ---------------- */
  if (cmd === "control") {
    const settings = config.settings;
    const buttons = Object.entries(settings).map(([k, v]) => ({
      type: "postback",
      title: `${v === true ? "✅" : "❌"} ${k}`,
      payload: `toggle_${k}`
    }));
    const msg = {
      body: "⚙️ GPT-5 PRO — AI Control Panel\nClick a setting to toggle ON/OFF:",
      buttons: buttons.slice(0, 10)
    };
    return api.sendMessage(msg, threadID, messageID);
  }

  /* ---------------- Command: status ---------------- */
  if (cmd === "status") {
    const s = config.settings;
    const list = Object.entries(s).map(([k, v]) => `${k}: ${typeof v === "boolean" ? (v ? "ON" : "OFF") : v}`).join(", ");
    return api.sendMessage(`📊 Status:\nMaintenance: ${config.maintenance ? "ON" : "OFF"}\nAPI: ${config.api_url}\nSettings: ${list}`, threadID, messageID);
  }

  /* ---------------- Command: reset (clear user memory) ---------------- */
  if (cmd === "reset") {
    delete memory[senderID];
    saveMemory(memory);
    return api.sendMessage("🧹 Conversation memory cleared for you.", threadID, messageID);
  }

  /* ---------------- Command: admininfo ---------------- */
  if (cmd === "admininfo") {
    const adminMsg = `👑 System Admin\nName: Manuelson (System Admin)\nProfile: ${config.admin_profile_url}\nRole: System Creator & Maintainer\nUse 'ai report' to send issues to admins.`;
    const payload = {
      body: adminMsg,
      buttons: [
        { type: "web_url", title: "🌐 View Profile", url: config.admin_profile_url },
        { type: "postback", title: "📢 Contact Admin", payload: "contact_admin" }
      ]
    };
    return api.sendMessage(payload, threadID, messageID);
  }

  /* ---------------- Command: rules (dynamic card) ---------------- */
  if (cmd === "rules") {
    const settingsList = Object.entries(config.settings).map(([k, v]) => `• ${k}: ${typeof v === "boolean" ? (v ? "✅ ON" : "❌ OFF") : v}`).join("\n");
    const rulesText = `
📜 GPT-5 PRO — RULES & LIVE STATUS

1️⃣ Walang spam / flood.
2️⃣ No NSFW or violent content.
3️⃣ I-respect ang ibang users.
4️⃣ Huwag gamitin ang AI sa panlilinlang.
5️⃣ Bawal ang fake reports.
6️⃣ I-double check ang sagot bago i-share.
7️⃣ Huwag mag-send ng malware links.
8️⃣ Admins lang ang nagto-toggle ng settings.
9️⃣ Huwag i-flood ang AI ng maraming images.
🔟 Pagsang-ayon sa patakaran ang paggamit.

⚙️ Current Settings:
${settingsList}

🧠 Powered by GPT-5 PRO
`;
    const payload = {
      body: rulesText,
      buttons: [
        { type: "postback", title: "⚙️ AI Settings", payload: "open_ai_settings" },
        { type: "postback", title: "🧩 Control Panel", payload: "open_ai_control" },
        { type: "postback", title: "📢 Contact Admin", payload: "contact_admin" }
      ]
    };
    return api.sendMessage(payload, threadID, messageID);
  }

  /* ---------------- Command: sendnoti (admin broadcast) ---------------- */
  if (cmd === "sendnoti") {
    if (!isAdmin) return api.sendMessage("❌ Only admins can use sendnoti.", threadID, messageID);
    const content = args.slice(1).join(" ").trim();
    if (!content) return api.sendMessage("⚠️ Provide a message. Usage: ai sendnoti <message>", threadID, messageID);
    api.sendMessage("📢 Sending notification to all groups...", threadID, messageID);
    try {
      // getThreadList may differ by framework; try several fetch sizes
      const threads = await api.getThreadList(100, null, ["INBOX"]);
      let count = 0;
      for (const t of threads) {
        // Depending on framework thread object shape: t.isGroup may be t.is_group
        const isGroup = t.isGroup || t.is_group || (typeof t.participantIDs !== "undefined" && t.participantIDs.length > 2);
        if (isGroup) {
          try {
            await api.sendMessage(`📣 AI Announcement:\n\n${content}`, t.threadID || t.threadId || t.id);
            count++;
          } catch (e) { console.error("sendnoti error:", e?.message || e); }
        }
      }
      return api.sendMessage(`✅ Notification sent to ${count} group(s).`, threadID);
    } catch (e) {
      console.error("sendnoti list error:", e?.message || e);
      return api.sendMessage("⚠️ Failed to enumerate threads for broadcast.", threadID);
    }
  }

  /* ---------------- Command: report (manual) ---------------- */
  if (cmd === "report") {
    const content = args.slice(1).join(" ").trim();
    if (!content) return api.sendMessage("⚠️ Usage: ai report <details>", threadID, messageID);
    const note = `🚨 AI REPORT\nFrom: ${senderName} (${senderID})\nMessage: ${content}\nTime: ${new Date().toLocaleString()}`;
    const cfg = loadConfig();
    await sendReportToAdmins(api, cfg, "Manual Report", note);
    return api.sendMessage("✅ Your report was sent to the admins. Thank you.", threadID, messageID);
  }

  /* ---------------- Not a command: proceed to normal chat ---------------- */
  // Build ask from args
  const ask = args.join(" ").trim();
  if (!ask) return api.sendMessage("💬 Please enter a message. Usage: ai <message>", threadID, messageID);

  // Auto-detect spam (async)
  autoDetectAndReport({ api, event, ask, config }).catch(() => {});

  // Auto react (if enabled)
  if (config.settings.auto_react) {
    try {
      const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
      if (typeof api.setMessageReaction === "function") {
        await api.setMessageReaction(emoji, messageID, () => {}, true);
      }
    } catch (e) { /* ignore */ }
  }

  // Memory handling
  if (!memory[senderID]) memory[senderID] = { lastUpdate: Date.now(), messages: [] };
  if (config.settings.context_memory) {
    // auto reset if old
    if (Date.now() - (memory[senderID].lastUpdate || 0) > MEMORY_LIFETIME) {
      memory[senderID] = { lastUpdate: Date.now(), messages: [] };
    }
    memory[senderID].messages.push({ role: "user", content: ask });
    if (memory[senderID].messages.length > 10) memory[senderID].messages.shift();
    memory[senderID].lastUpdate = Date.now();
    saveMemory(memory);
  }

  // Thinking notice
  const thinkingMsg = await new Promise((resolve) => api.sendMessage("🤔 GPT-5 PRO is thinking...", threadID, (err, info) => resolve(info)));

  // Call API with retries
  const baseUrl = config.api_url || DEFAULT_API;
  const url = `${baseUrl}?uid=${senderID}`;
  let responseText = "";
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const payload = {
        messages: config.settings.context_memory ? (memory[senderID].messages || [{ role: "user", content: ask }]) : [{ role: "user", content: ask }],
        settings: config.settings,
        meta: { tone: config.settings.style_tone, fast: config.settings.fast_mode, deep: config.settings.deep_mode }
      };
      const res = await axios.post(url, payload, { timeout: API_TIMEOUT });
      responseText = res.data?.response || res.data?.reply || (typeof res.data === "string" ? res.data : "");
      break;
    } catch (err) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        // auto-report API failure
        await sendReportToAdmins(api, config, "API Failure", `${err?.message || err}`);
        try { await api.unsendMessage(thinkingMsg.messageID); } catch {}
        return api.sendMessage("❌ GPT-5 PRO failed to respond. Admins notified.", threadID);
      }
    }
  }

  try { await api.unsendMessage(thinkingMsg.messageID); } catch {}

  if (!responseText || !responseText.toString().trim()) {
    return api.sendMessage("⚠️ No valid response from GPT-5 PRO.", threadID, messageID);
  }

  // Save assistant reply to memory
  if (config.settings.context_memory) {
    memory[senderID].messages.push({ role: "assistant", content: responseText });
    memory[senderID].lastUpdate = Date.now();
    saveMemory(memory);
  }

  // Optionally auto-summarize or translate would be handled by API via settings flags
  const formatted = responseText.replace(/\n{3,}/g, "\n\n");
  const chunks = splitMessage(`🤖 GPT-5 PRO\n\n${formatted}`);

  for (const chunk of chunks) {
    // Attach adaptive or generic buttons if enabled
    if (config.settings.ai_buttons) {
      const buttons = config.settings.adaptive_buttons ? getAdaptiveButtons(ask) : [
        { type: "postback", title: "🧠 Explain More", payload: `gpt5 more ${encodeURIComponent(ask)}` },
        { type: "postback", title: "💡 Summarize", payload: `gpt5 summarize ${encodeURIComponent(ask)}` },
        { type: "postback", title: "🔁 Regenerate", payload: `gpt5 regen ${encodeURIComponent(ask)}` }
      ];
      await api.sendMessage({ body: chunk, buttons }, threadID);
    } else {
      await api.sendMessage(chunk, threadID);
    }
  }
};

/* ---------------- sendAiRulesIfConfigured helper ---------------- */

async function sendAiRulesIfConfigured(api, threadID, config) {
  // you may toggle auto-send rules for new threads in config if desired
  // For now we only send if called
  return;
}

/* ---------------- Postback / Event Handler ----------------
   This should be wired by your bot framework so postbacks are routed here.
   It handles toggle_... payloads, control/buttons payloads, and some gpt5 postbacks.
*/
module.exports.handleEvent = async function ({ api, event }) {
  if (!event.postback) return;
  const payload = event.postback.payload || "";
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  const config = loadConfig();

  // Toggle setting payload: toggle_settingName
  if (payload.startsWith("toggle_")) {
    const key = payload.replace("toggle_", "");
    if (!Object.prototype.hasOwnProperty.call(config.settings, key)) {
      return api.sendMessage("⚠️ Unknown setting.", threadID, messageID);
    }
    // Only admins can toggle via control panel
    const admins = config.admins.length ? config.admins : [senderID];
    if (!admins.includes(senderID)) return api.sendMessage("❌ Only admins can toggle settings.", threadID, messageID);
    config.settings[key] = !config.settings[key];
    saveConfig(config);
    return api.sendMessage(`⚙️ ${key} is now ${config.settings[key] ? "✅ ON" : "❌ OFF"}`, threadID, messageID);
  }

  // Open settings / control / contact admin
  if (payload === "open_ai_settings") {
    const entries = Object.entries(config.settings)
      .map(([k, v]) => `• ${k}: ${typeof v === "boolean" ? (v ? "✅ ON" : "❌ OFF") : v}`)
      .join("\n");
    return api.sendMessage(`⚙️ AI Settings:\n\n${entries}\n\nUse 'ai settings <name> <on/off>' to change.`, threadID, messageID);
  }
  if (payload === "open_ai_control") {
    const settings = config.settings;
    const buttons = Object.entries(settings).map(([k, v]) => ({
      type: "postback",
      title: `${v === true ? "✅" : "❌"} ${k}`,
      payload: `toggle_${k}`
    }));
    return api.sendMessage({ body: "AI Control Panel — click to toggle:", buttons: buttons.slice(0, 10) }, threadID, messageID);
  }
  if (payload === "contact_admin") {
    return api.sendMessage(`📬 Contact Admin:\nProfile: ${config.admin_profile_url}\nOr use 'ai report <message>' to notify admins.`, threadID, messageID);
  }

  // If payload begins with 'gpt5 ' we will call run directly to perform that subcommand
  if (payload.startsWith("gpt5 ")) {
    // create fake args array: remove 'gpt5' token
    const tokens = payload.split(" ");
    const fakeArgs = tokens.slice(1).map(t => decodeURIComponent(t));
    try {
      await module.exports.run({ api, event: { threadID, messageID, senderID }, args: fakeArgs });
    } catch (e) {
      console.error("Error running postback command:", e?.message || e);
      return api.sendMessage("⚠️ Failed to run requested action.", threadID, messageID);
    }
    return;
  }

  // other postbacks: ignore
};

/* ---------------- End of ai.js ---------------- */

