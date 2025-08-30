const axios = require("axios");
const fs = require("fs-extra");
const tinyurl = require("tinyurl");

module.exports.config = {
  name: "autodl",
  version: "3.1",
  hasPermission: 0,
  usePrefix: true,
  aliases: [],
  description: "Auto download videos/images from TikTok, YouTube, FB, IG, Reels, X and more.",
  usages: "autodl <paste media link>",
  credits: "Dipto & xnil6x (converted by OpenAI)",
  cooldowns: 0,
  dependencies: {
    axios: "",
    "fs-extra": "",
    tinyurl: ""
  }
};

const getBaseApiUrl = async () => {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/xnil6x404/Api-Zone/refs/heads/main/Api.json");
    return res.data.xnil2;
  } catch (e) {
    throw new Error("Failed to fetch base API URL");
  }
};

module.exports.run = async function ({ api, event, args }) {
  const body = args.join(" ").trim();
  if (!body) {
    return api.sendMessage(
      "❌ Please provide a link to download media.\nExample: autodl https://www.facebook.com/reel/123456789",
      event.threadID,
      event.messageID
    );
  }

  const supportedSites = [
    "https://vt.tiktok.com", "https://www.tiktok.com/", "https://vm.tiktok.com",
    "https://www.facebook.com", "https://fb.watch", "https://www.instagram.com/",
    "https://www.instagram.com/p/", "https://youtu.be/", "https://www.youtube.com/",
    "https://youtube.com/watch", "https://x.com/", "https://twitter.com/", "https://pin.it/",
    "facebook.com/reel/"
  ];

  if (!supportedSites.some(site => body.includes(site))) {
    return api.sendMessage(
      "❌ Unsupported URL. Please provide a link from TikTok, YouTube, FB (including Reels), IG, X, etc.",
      event.threadID,
      event.messageID
    );
  }

  const startTime = Date.now();
  const waitMsg = await api.sendMessage("⏳ Fetching media for you...\nPlease hold on!", event.threadID, event.messageID);

  try {
    const baseApiUrl = await getBaseApiUrl();
    const apiUrl = `${baseApiUrl}/alldl?url=${encodeURIComponent(body)}`;
    const { data } = await axios.get(apiUrl);

    const content = data?.content;
    const mediaLink = content?.result || content?.url;

    if (!mediaLink) {
      await api.unsendMessage(waitMsg.messageID);
      return api.sendMessage(
        "❌ Unable to retrieve media. Please check the link or try again later.",
        event.threadID,
        event.messageID
      );
    }

    let extension = ".mp4";
    let mediaIcon = "🎬";
    let mediaLabel = "Video";

    if (mediaLink.match(/\.(jpe?g|png)(\?|$)/i)) {
      extension = mediaLink.match(/\.jpe?g(\?|$)/i) ? ".jpg" : ".png";
      mediaIcon = "🖼️";
      mediaLabel = "Photo";
    }

    const fileName = `media-${event.senderID}-${Date.now()}${extension}`;
    const cacheDir = `${__dirname}/cache`;
    fs.ensureDirSync(cacheDir);
    const filePath = `${cacheDir}/${fileName}`;

    const response = await axios.get(mediaLink, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

    const shortUrl = await tinyurl.shorten(mediaLink);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    await api.unsendMessage(waitMsg.messageID);

    const stylishMessage = `
╭━━━[ ✅ 𝗠𝗲𝗱𝗶𝗮 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱 ]━━━╮
┃ ${mediaIcon} Type: ${mediaLabel}
┃ ⚡ Speed: ${duration}s
┃ 🔗 Link: ${shortUrl}
╰━━━━━━━━━━━━━━━━━━━━━━╯
Enjoy your ${mediaLabel.toLowerCase()}! Made with ❤️ by xnil.
`;

    await api.sendMessage(
      {
        body: stylishMessage,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (err) {
    console.error("[autodl] Error:", err);
    await api.unsendMessage(waitMsg.messageID);
    api.setMessageReaction("❌", event.messageID, true);

    const errorMsg = `
❌ Oops! Something went wrong.
━━━━━━━━━━━━━━━
• Error: ${err.message}
• Try again later or check your link.
━━━━━━━━━━━━━━━`;

    api.sendMessage(errorMsg, event.threadID, event.messageID);
  }
};
