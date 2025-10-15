const axios = require("axios");

module.exports.config = {
  name: "dragonball",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["dbz", "db"],
  description: "Get Dragon Ball characters and planets info from dragonball-api.com",
  usages: "dragonball [planet|character] [id|filters]",
  credits: "Created by GPT-5",
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const baseUrl = "https://dragonball-api.com/api";
  const type = args[0]?.toLowerCase();

  if (!type) {
    return api.sendMessage(
      "⚡ Dragon Ball API Commands:\n\n" +
      "🌍 Planets:\n" +
      "• dragonball planet — show all planets\n" +
      "• dragonball planet [id] — show planet by ID\n" +
      "• dragonball planet destroyed — show destroyed planets\n\n" +
      "🥋 Characters:\n" +
      "• dragonball character — show all characters\n" +
      "• dragonball character [id] — show character by ID\n" +
      "• dragonball character race=Saiyan affiliation='Z fighter'\n" +
      "• dragonball character page=2 limit=5",
      event.threadID, event.messageID
    );
  }

  api.sendMessage("⏳ Fetching data from Dragon Ball API...", event.threadID, event.messageID);

  try {
    let url = "";
    let data = null;

    // 🌍 PLANETS
    if (type === "planet" || type === "planets") {
      const sub = args[1];

      if (!sub) url = `${baseUrl}/planets`;
      else if (sub.toLowerCase() === "destroyed") url = `${baseUrl}/planets?isDestroyed=true`;
      else if (!isNaN(sub)) url = `${baseUrl}/planets/${sub}`;
      else return api.sendMessage("❌ Invalid planet command.", event.threadID, event.messageID);

      const res = await axios.get(url);
      data = res.data;

      // Show info
      if (Array.isArray(data.items || data)) {
        const planets = data.items || data;
        const msg = planets.map(p => `🌍 ${p.name}\n💥 Destroyed: ${p.isDestroyed ? "Yes" : "No"}`).join("\n\n");
        return api.sendMessage(msg, event.threadID, event.messageID);
      } else {
        const p = data;
        return api.sendMessage(
          `🌍 Planet: ${p.name}\n💥 Destroyed: ${p.isDestroyed ? "Yes" : "No"}\n🪐 Description: ${p.description || "N/A"}`,
          event.threadID, event.messageID
        );
      }
    }

    // 🥋 CHARACTERS
    if (type === "character" || type === "characters") {
      let query = "";
      const params = args.slice(1).join(" ");

      if (!params) url = `${baseUrl}/characters`;
      else if (!isNaN(params)) url = `${baseUrl}/characters/${params}`;
      else {
        query = params.replace(/\s+/g, "&");
        url = `${baseUrl}/characters?${query}`;
      }

      const res = await axios.get(url);
      data = res.data;

      if (Array.isArray(data.items || data)) {
        const chars = data.items || data;
        const msg = chars.map(c =>
          `🥋 ${c.name}\n👤 Race: ${c.race || "Unknown"}\n🏠 Affiliation: ${c.affiliation || "N/A"}`
        ).join("\n\n");
        return api.sendMessage(msg, event.threadID, event.messageID);
      } else {
        const c = data;
        return api.sendMessage(
          `🥋 Character: ${c.name}\n👤 Race: ${c.race || "Unknown"}\n🏠 Affiliation: ${c.affiliation || "N/A"}\n💪 Ki: ${c.ki}\n🧠 Max Ki: ${c.maxKi}`,
          event.threadID, event.messageID
        );
      }
    }

    return api.sendMessage("❌ Unknown command type. Use 'planet' or 'character'.", event.threadID, event.messageID);
  } catch (err) {
    console.error("Dragon Ball API error:", err.message);
    api.sendMessage("❌ Failed to fetch Dragon Ball data. Try again later.", event.threadID, event.messageID);
  }
};
