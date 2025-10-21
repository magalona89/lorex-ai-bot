const axios = require('axios');
const fs = require('fs');
const path = require('path');

const adminUID = "61580959514473";
const API_KEY = "pub_f43d17a67c5340b88aede3ae65cfc961";
const stateFile = path.join(__dirname, "newspost_state.json");

let isUnderMaintenance = false;
let isAutoNewsOn = false;
let newsInterval = null;
let postCount = 0;

// 🌍 Global list of countries + main cities
const locations = [
  // Philippines and earlier countries
  "Manila", "Cebu City", "Davao City", "Baguio", "Palawan", "Philippines",
  "Japan", "United States", "Canada", "Australia",
  "Namibia", "Windhoek", "Walvis Bay", "Swakopmund",
  "Nauru", "Yaren", "Anabar", "Buada",
  "Nepal", "Kathmandu", "Pokhara", "Lalitpur",
  "Netherlands", "Amsterdam", "Rotterdam", "The Hague",
  "New Zealand", "Wellington", "Auckland", "Christchurch",
  "Nicaragua", "Managua", "León", "Granada",
  "Niger", "Niamey", "Zinder", "Maradi",
  "Nigeria", "Abuja", "Lagos", "Kano",
  "North Korea", "Pyongyang", "Hamhung", "Chongjin",
  "North Macedonia", "Skopje", "Bitola", "Kumanovo",
  "Norway", "Oslo", "Bergen", "Trondheim",
  "Oman", "Muscat", "Salalah", "Sohar",
  "Pakistan", "Islamabad", "Karachi", "Lahore",
  "Palau", "Ngerulmud", "Koror", "Airai",
  "Palestine", "Ramallah", "Gaza City", "Hebron",
  "Panama", "Panama City", "Colón", "David",
  "Papua New Guinea", "Port Moresby", "Lae", "Madang",
  "Paraguay", "Asunción", "Ciudad del Este", "Encarnación",
  "Peru", "Lima", "Arequipa", "Trujillo",
  "Poland", "Warsaw", "Kraków", "Łódź",
  "Portugal", "Lisbon", "Porto", "Coimbra",
  "Qatar", "Doha", "Al Wakrah", "Al Khor",
  "Romania", "Bucharest", "Cluj-Napoca", "Timișoara",
  "Russia", "Moscow", "Saint Petersburg", "Novosibirsk",
  "Rwanda", "Kigali", "Butare", "Gitarama",
  "Saint Kitts and Nevis", "Basseterre", "Charlestown",
  "Saint Lucia", "Castries", "Vieux Fort", "Soufrière",
  "Samoa", "Apia", "Asau", "Mulifanua",
  "San Marino", "San Marino", "Serravalle", "Borgo Maggiore",
  "Sao Tome and Principe", "São Tomé", "Santo António", "Neves",
  "Saudi Arabia", "Riyadh", "Jeddah", "Mecca",
  "Senegal", "Dakar", "Saint-Louis", "Ziguinchor",
  "Serbia", "Belgrade", "Novi Sad", "Niš",
  "Seychelles", "Victoria", "Anse Boileau", "Beau Vallon",
  "Sierra Leone", "Freetown", "Bo", "Kenema",
  "Singapore", "Singapore", "Jurong", "Tampines",
  "Slovakia", "Bratislava", "Košice", "Prešov",
  "Slovenia", "Ljubljana", "Maribor", "Celje",
  "Solomon Islands", "Honiara", "Gizo", "Auki",
  "Somalia", "Mogadishu", "Hargeisa", "Berbera",
  "South Africa", "Pretoria", "Johannesburg", "Cape Town",
  "South Korea", "Seoul", "Busan", "Incheon",
  "Spain", "Madrid", "Barcelona", "Valencia",
  "Sri Lanka", "Colombo", "Kandy", "Galle",
  "Sudan", "Khartoum", "Omdurman", "Port Sudan",
  "Sweden", "Stockholm", "Gothenburg", "Malmö",
  "Switzerland", "Bern", "Zurich", "Geneva",
  "Syria", "Damascus", "Aleppo", "Homs",
  "Taiwan", "Taipei", "Kaohsiung", "Taichung",
  "Thailand", "Bangkok", "Chiang Mai", "Phuket"
];

// 🎯 Topics for auto-search
const topics = ["politics", "sports"];

// 🧠 Load state
function loadState() {
  if (fs.existsSync(stateFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      isAutoNewsOn = data.isOn || false;
      postCount = data.count || 0;
    } catch (err) {
      console.error("Error loading news state:", err);
    }
  }
}

// 💾 Save state
function saveState() {
  try {
    fs.writeFileSync(stateFile, JSON.stringify({ isOn: isAutoNewsOn, count: postCount }, null, 2));
  } catch (err) {
    console.error("Error saving news state:", err);
  }
}

// 🔁 Start autopost
function startAutoNews(api, threadID) {
  if (newsInterval) clearInterval(newsInterval);
  newsInterval = setInterval(async () => {
    try {
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const query = `${randomLocation} ${randomTopic}`;
      const news = await fetchNews(query);
      const now = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
      const message = `🌍 Auto News Update #${postCount + 1}\n📍 Location: ${randomLocation}\n🗞️ Topic: ${randomTopic}\n🕒 ${now}\n\n${news}`;
      api.sendMessage(message, threadID);
      postCount++;
      saveState();
    } catch (err) {
      console.error("Auto news error:", err.message);
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// 🛑 Stop autopost
function stopAutoNews() {
  if (newsInterval) {
    clearInterval(newsInterval);
    newsInterval = null;
  }
}

// 🔍 Fetch news from API
async function fetchNews(topic) {
  const res = await axios.get("https://newsdata.io/api/1/latest", {
    params: { apikey: API_KEY, q: topic, language: "en" }
  });

  if (!res.data?.results || res.data.results.length === 0) {
    return `⚠️ No news found for "${topic}".`;
  }

  let newsText = "";
  res.data.results.slice(0, 3).forEach((a, i) => {
    newsText += `${i + 1}. ${a.title}\n`;
    if (a.description) newsText += `📝 ${a.description}\n`;
    if (a.link) newsText += `🔗 ${a.link}\n`;
    newsText += `🕒 ${new Date(a.pubDate).toLocaleString("en-PH")}\n\n`;
  });
  return newsText.trim();
}

// 🧩 Command handler
module.exports.config = {
  name: "newspost",
  version: "3.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["newsauto", "np"],
  description: "Autopost latest global news (politics & sports)",
  usages: "newspost [topic|on|off|maint on/off]",
  credits: "ChatGPT",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const { senderID: uid, threadID, messageID } = event;
  const input = args.join(" ").trim().toLowerCase();

  // ⚙️ Maintenance mode
  if (input.startsWith("maint")) {
    if (uid !== adminUID) return api.sendMessage("⛔ Only admin can toggle maintenance.", threadID, messageID);
    const toggle = args[1]?.toLowerCase();
    if (toggle === "on") {
      isUnderMaintenance = true;
      return api.sendMessage("🔧 Maintenance mode ON.", threadID, messageID);
    } else if (toggle === "off") {
      isUnderMaintenance = false;
      return api.sendMessage("✅ Maintenance mode OFF.", threadID, messageID);
    } else {
      return api.sendMessage("⚙️ Usage: newspost maint on/off", threadID, messageID);
    }
  }

  // 🚧 Maintenance check
  if (isUnderMaintenance && uid !== adminUID)
    return api.sendMessage("🚧 News system under maintenance.", threadID, messageID);

  // 🟢 Start autopost
  if (input === "on") {
    if (isAutoNewsOn) return api.sendMessage("✅ Auto news already ON.", threadID, messageID);
    isAutoNewsOn = true;
    saveState();
    startAutoNews(api, threadID);
    return api.sendMessage("📰 Auto news posting started! (Politics & Sports updates every 5 mins)", threadID, messageID);
  }

  // 🔴 Stop autopost
  if (input === "off") {
    if (!isAutoNewsOn) return api.sendMessage("❌ Auto news already OFF.", threadID, messageID);
    isAutoNewsOn = false;
    saveState();
    stopAutoNews();
    return api.sendMessage("🛑 Auto news posting stopped.", threadID, messageID);
  }

  // 🔍 Manual search
  const topic = args.length > 0 ? args.join(" ") : "Philippines politics";
  const loadingMsg = await new Promise(resolve =>
    api.sendMessage(`⏳ Fetching latest news about "${topic}"...`, threadID, (err, info) => resolve(info))
  );

  try {
    const news = await fetchNews(topic);
    api.editMessage(news, loadingMsg.messageID, threadID);
  } catch (err) {
    console.error("Manual news fetch error:", err.message);
    api.editMessage("❌ Failed to fetch news.", loadingMsg.messageID, threadID);
  }
};

// 🔄 Load state at start
loadState();
