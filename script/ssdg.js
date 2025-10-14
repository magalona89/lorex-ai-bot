const axios = require('axios');

module.exports.config = {
  name: 'imdb',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: false,
  aliases: ['movie', 'film'],
  description: "Search or get movie details via imdb.iamidiotareyoutoo.com",
  usages: "imdb tt=ttXXXXXXX | imdb q=Movie Name",
  credits: "Free Movie DB API",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  if (!args.length) {
    return api.sendMessage("❌ Please specify `tt=` for details or `q=` for search.\nExample: `imdb tt=tt2250912` or `imdb q=Spiderman`", threadID, messageID);
  }

  const arg = args[0];
  let url;
  if (arg.startsWith("tt=")) {
    const tt = arg.slice(3);
    url = `https://imdb.iamidiotareyoutoo.com/search?tt=tt${tt}`;
  } else if (arg.startsWith("q=")) {
    const q = encodeURIComponent(arg.slice(2));
    url = `https://imdb.iamidiotareyoutoo.com/search?q=${q}`;
  } else {
    // assume search by name
    const q = encodeURIComponent(args.join(" "));
    url = `https://imdb.iamidiotareyoutoo.com/search?q=${q}`;
  }

  const loadingMsg = await new Promise(resolve => {
    api.sendMessage("🔍 Fetching movie data...", threadID, (err, info) => resolve(info));
  });

  try {
    const res = await axios.get(url);
    const data = res.data;

    // If `tt=` mode, expects detailed object
    if (arg.startsWith("tt=")) {
      // sample fields: name, year, rating, plot, etc.
      const name = data.name || data.title || "Unknown";
      const year = data.year || data.release_year || "N/A";
      const rating = data.rating || "N/A";
      const plot = data.plot || data.description || "No description available.";
      const poster = data.poster_url || data.img || "";

      let text = `🎬 ${name} (${year})\nRating: ${rating}\n\n${plot}`;
      if (poster) text += `\n\nPoster: ${poster}`;

      await api.editMessage(text, loadingMsg.messageID, threadID);
    } else {
      // Search mode — list results
      const results = data || [];
      if (!Array.isArray(results) || results.length === 0) {
        return api.editMessage("❌ No results found.", loadingMsg.messageID, threadID);
      }
      let text = `🔎 Search results:\n`;
      const limit = Math.min(5, results.length);
      for (let i = 0; i < limit; i++) {
        const item = results[i];
        const nm = item.name || item.title || "Unknown";
        const yr = item.year || item.release_year || "";
        const ttId = item.tt || item.id || "";
        const link = ttId ? `https://www.imdb.com/title/${ttId}` : "";
        text += `\n${i + 1}. ${nm} ${yr ? `(${yr})` : ""}\n🔗 ${link}`;
      }
      await api.editMessage(text, loadingMsg.messageID, threadID);
    }
  } catch (error) {
    console.error("IMDb API error:", error.response?.data || error.message);
    await api.editMessage("❌ Failed to fetch movie data. Try again later.", loadingMsg.messageID, threadID);
  }
};
