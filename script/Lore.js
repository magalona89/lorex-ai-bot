const fs = require("fs");
const path = require("path");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const login = require("./ws3-fca/index");
const script = path.join(__dirname, "script");

let botStarted = false;

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map()
};

global.utils = {
  async getStreamFromURL(url) {
    const res = await axios.get(url, { responseType: "stream" });
    return res.data;
  }
};

mongoose.connect("paste_mongo_uri_here", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const BlockSchema = new mongoose.Schema({
  userID: String,
  threadID: String,
  reason: String,
  blockedAt: Date,
  expiresAt: Date
});
const BlockModel = mongoose.model("blocked_users", BlockSchema);

fs.readdirSync(script).forEach(file => {
  const commandPath = path.join(script, file);
  if (fs.statSync(commandPath).isFile() && file.endsWith(".js")) {
    const { config, run, handleEvent } = require(commandPath);
    if (config && run) Utils.commands.set(config.name, { ...config, run });
    if (config && handleEvent) Utils.handleEvent.set(config.name, { ...config, handleEvent });
  }
});

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function handleJoinNoti(event, api) {
  const { threadID } = event;
  const added = event.logMessageData?.addedParticipants || [];

  if (added.some(p => p.userFbId === api.getCurrentUserID())) {
    api.changeNickname('► 𝑳𝒐𝒓𝒆𝒙 𝑨𝒊 ◄', threadID, api.getCurrentUserID());
    return api.sendMessage({
      body: "━━━━━━━━━━━━━\n\n✪Nova Ai Connected ✅\n\nHello! my name is Nova, an Educational A.I. Companion Chatbot. Thank you for adding me here!\n\nMy commands are:\n\nnova, nova\n\n━━━━━━━━━━━━━"
    }, threadID);
  }

  if (event.logMessageType === "log:subscribe") {
    api.getThreadInfo(threadID).then(({ threadName, participantIDs }) => {
      const ordinal = getOrdinal(participantIDs.length);
      const nameArray = added.map(p => p.fullName);
      let msg = "✪ Hello {name}!\n\nWelcome!, You're the {ordinal} Member of {threadName} Group. Please Enjoy Your Stay And Make Lots Of Friends 🥳😍";
      msg = msg.replace(/\{name}/g, nameArray.join(', '))
               .replace(/\{ordinal}/g, ordinal)
               .replace(/\{threadName}/g, threadName);
      api.sendMessage({ body: msg }, threadID);
    }).catch(() => {});
  }
}

function setupMessageListener(api) {
  const recentMessages = new Map();

  api.listenMqtt(async (err, event) => {
    if (err) {
      const ignored = [1390008];
      if (ignored.includes(err.error)) return;
      if (err.error === 1357004) return;
      return;
    }

    try {
      if (event.logMessageType === "log:subscribe") {
        handleJoinNoti(event, api);
        return;
      }

      const { type, messageID, senderID, threadID, body, attachments } = event;

      const badWords = [
        "iyot", "sex", "jakol", "tangina mo", "puta", "pota", "tangina", "tang ina",
        "bitch", "bullshit", "porn", "sex video", "naked", "vagina", "puke", "burat",
        "penis", "pussy", "dede", "cum", "blowjob", "boobs", "suso", "jack off"
      ];
      const lowered = (body || "").toLowerCase();

      const isBlocked = await BlockModel.findOne({
        userID: senderID,
        threadID,
        expiresAt: { $gt: new Date() }
      });

      if (isBlocked) {
        return api.sendMessage(
          "❌ You're temporarily blocked for using inappropriate language. Try again after 24 hours.",
          threadID, senderID
        );
      }

      const matchedBadWord = badWords.find(word => lowered.includes(word));
      if (matchedBadWord) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
        await BlockModel.findOneAndUpdate(
          { userID: senderID, threadID },
          {
            userID: senderID,
            threadID,
            reason: `Used banned word: "${matchedBadWord}"`,
            blockedAt: new Date(),
            expiresAt
          },
          { upsert: true }
        );

        return api.sendMessage(
          `⚠️ You used inappropriate language in a command and have been blocked for 24 hours.`,
          threadID,
          senderID
        );
      }

      if (type === "message_unsend") {
        const threadCache = recentMessages.get(threadID);
        const original = threadCache?.[messageID];
        if (original && original.senderID === senderID) {
          let name = "Someone";
          try {
            const userInfo = await api.getUserInfo(senderID);
            name = userInfo?.[senderID]?.name || "Someone";
          } catch (_) {}
          if (original.body) {
            api.sendMessage(`😎 ${name} tried to unsend:\n\n"${original.body}"`, threadID);
          }
          if (original.attachments.length > 0) {
            for (const att of original.attachments) {
              const info = `😎 ${name} unsent an attachment (${att.type})`;
              api.sendMessage({
                body: info,
                attachment: ["photo", "audio", "video"].includes(att.type)
                  ? await global.utils.getStreamFromURL(att.url)
                  : undefined
              }, threadID);
            }
          }
        }
        if (threadCache) delete threadCache[messageID];
        return;
      }

      if (messageID && (body || attachments?.length)) {
        if (!recentMessages.has(threadID)) recentMessages.set(threadID, {});
        const threadCache = recentMessages.get(threadID);

        let senderName = "Unknown";
        try {
          const userInfo = await api.getUserInfo(senderID);
          senderName = userInfo?.[senderID]?.name || "Unknown";
        } catch (_) {}

        threadCache[messageID] = {
          senderID,
          senderName,
          body: body?.trim() || null,
          attachments: attachments || []
        };

        if (Object.keys(threadCache).length > 200) {
          const oldest = Object.keys(threadCache)[0];
          delete threadCache[oldest];
        }
      }

      const trimmed = body?.trim();
      const cmd = trimmed?.split(" ")[0]?.toLowerCase();
      const args = trimmed ? trimmed.split(" ").slice(1) : [];
      const matched = Utils.commands.get(cmd);

      const cooldownKey = `${threadID}:${senderID}`;
      if (Utils.cooldowns.has(cooldownKey)) return;
      Utils.cooldowns.set(cooldownKey, Date.now());
      setTimeout(() => Utils.cooldowns.delete(cooldownKey), 3500);

      if (matched?.run) {
        await matched.run({ api, event, args });
      }

    } catch (err) {
      console.error("❌ Error in message handler:", err);
    }
  });
}

function startBot() {
  if (botStarted) return;
  botStarted = true;

  const appstatePath = path.join(__dirname, "appstate.json");
  if (!fs.existsSync(appstatePath)) return;

  const appState = JSON.parse(fs.readFileSync(appstatePath, "utf8"));

  login({ appState }, {}, async (err, api) => {
    if (err) return;

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      autoMarkRead: true,
      autoMarkDelivery: false
    });

    setupMessageListener(api);
  });
}

startBot();

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.listen(PORT);
