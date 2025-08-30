const axios = require("axios");

function fmtNum(n) {
  if (n == null) return "0";
  const x = Number(n);
  if (x >= 1_000_000_000) return (x / 1_000_000_000).toFixed(1) + "B";
  if (x >= 1_000_000) return (x / 1_000_000).toFixed(1) + "M";
  if (x >= 1_000) return (x / 1_000).toFixed(1) + "K";
  return String(x);
}

function fmtDur(sec) {
  sec = Number(sec) || 0;
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function videoSummary(v, idx) {
  const author = v?.author?.nickname || v?.author?.unique_id || "Unknown";
  const musicTitle = v?.music_info?.title || "Unknown";
  const musicAuthor = v?.music_info?.author || "Unknown";
  return `${idx}. 🎬 ${v?.title || "No title"}
👤 ${author}  •  🌍 ${v?.region || "N/A"}  •  ⏱️ ${fmtDur(v?.duration)}
👀 ${fmtNum(v?.play_count)}  ❤️ ${fmtNum(v?.digg_count)}  💬 ${fmtNum(v?.comment_count)}  🔁 ${fmtNum(v?.share_count)}
🎵 ${musicTitle} — ${musicAuthor}\n`;
}

function videoDetails(v) {
  const authorName = v?.author?.nickname || v?.author?.unique_id || "Unknown";
  const authorHandle = v?.author?.unique_id ? `@${v.author.unique_id}` : "";
  const created = v?.create_time ? new Date(v.create_time * 1000).toLocaleString() : "N/A";
  const mb = v?.size ? (Number(v.size) / (1024 * 1024)).toFixed(2) + " MB" : "N/A";
  const music = v?.music_info;
  return `📄 Video info
• Title: ${v?.title || "No title"}
• Video ID: ${v?.video_id || "N/A"}
• Author: ${authorName} ${authorHandle}
• Region: ${v?.region || "N/A"}
• Duration: ${fmtDur(v?.duration)}
• Created: ${created}
• Plays: ${fmtNum(v?.play_count)}  •  Likes: ${fmtNum(v?.digg_count)}
• Comments: ${fmtNum(v?.comment_count)}  •  Shares: ${fmtNum(v?.share_count)}  •  Downloads: ${fmtNum(v?.download_count)}
• File size: ${mb}
• Music: ${music?.title || "Unknown"} — ${music?.author || "Unknown"}
• Music URL: ${music?.play || "N/A"}
`;
}

module.exports.config = {
  name: "video",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["ttsearch", "tiktoksearch"],
  description: "Search TikTok videos",
  usages: "tiksearch <query> | <count>",
  credits: "Aryan Chauhan (converted by OpenAI)",
  cooldowns: 0,
  dependencies: { axios: "" }
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) {
    return api.sendMessage("❌ Please provide a search query!\nExample: tiksearch anime edits | 5", event.threadID, event.messageID);
  }

  const input = args.join(" ").split("|");
  const query = input[0].trim();
  let count = input[1] ? parseInt(input[1].trim()) : 5;
  if (isNaN(count) || count <= 0) count = 5;
  if (count > 10) count = 10;

  try {
    const url = `https://aryapio.onrender.com/search/tiktok?query=${encodeURIComponent(query)}&count=${count}&apikey=aryan123`;
    const res = await axios.get(url, { timeout: 20000 });

    const videos = res?.data?.data?.videos || [];
    if (!Array.isArray(videos) || videos.length === 0) {
      return api.sendMessage("❌ No results found.", event.threadID, event.messageID);
    }

    let msg = `📱 TikTok Search Results for “${query}”\n\n`;
    videos.slice(0, count).forEach((v, i) => {
      msg += videoSummary(v, i + 1) + "\n";
    });
    msg += `👉 Reply with a number (1-${Math.min(count, videos.length)}) to download that video.\n`;
    msg += `ℹ️ Or reply "info <number>" to see full details.`;

    api.sendMessage(msg, event.threadID, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "tiksearch",
        author: event.senderID,
        videos,
        searchMsgID: info.messageID
      });
    }, event.messageID);

  } catch (e) {
    console.error("tiksearch.run error:", e?.response?.data || e.message);
    api.sendMessage("❌ Error while searching TikTok videos.", event.threadID, event.messageID);
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  if (event.senderID !== Reply.author) return;

  const body = (event.body || "").trim();
  const infoMatch = body.toLowerCase().match(/^info\s+(\d+)$/);
  const numMatch = body.match(/^\d+$/);

  if (infoMatch) {
    const choice = parseInt(infoMatch[1], 10);
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) return;
    const v = Reply.videos[choice - 1];
    return api.sendMessage(videoDetails(v), event.threadID, event.messageID);
  }

  if (!numMatch) return;
  const choice = parseInt(body, 10);
  if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) return;

  const v = Reply.videos[choice - 1];

  try {
    if (Reply.searchMsgID) api.unsendMessage(Reply.searchMsgID);

    const videoURL = v?.play || v?.wmplay;
    if (!videoURL) throw new Error("No downloadable URL in result.");

    let stream;
    try {
      stream = await axios.get(videoURL, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 30000
      });
    } catch (errPlay) {
      if (v?.wmplay && v?.wmplay !== videoURL) {
        stream = await axios.get(v.wmplay, {
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 30000
        });
      } else {
        throw errPlay;
      }
    }

    const author = v?.author?.nickname || v?.author?.unique_id || "Unknown";

    return api.sendMessage({
      body:
`🎬 ${v?.title || "TikTok Video"}
👤 ${author}  •  ⏱️ ${fmtDur(v?.duration)}
👀 ${fmtNum(v?.play_count)}  ❤️ ${fmtNum(v?.digg_count)}  💬 ${fmtNum(v?.comment_count)}  🔁 ${fmtNum(v?.share_count)}
📄 Reply "info ${choice}" for full details.`,
      attachment: stream.data
    }, event.threadID, event.messageID);

  } catch (e) {
    console.error("tiksearch.onReply error:", e?.response?.data || e.message);
    api.sendMessage("❌ Failed to download video.", event.threadID, event.messageID);
  }
};
