const axios = require('axios');

// Bold text converter (unchanged)
function convertToBold(text) {
    const boldMap = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    };
    return text.split('').map(char => boldMap[char] || char).join('');
}

// Get Philippine date/time (unchanged)
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
            hour12: true,
        });
        return now.replace(',', ' •');
    } catch (error) {
        return 'Date unavailable';
    }
}

// Profanity filter (unchanged)
function hasProfanity(text) {
    const badWords = ['badword1', 'badword2']; // Customize
    return badWords.some(word => text.toLowerCase().includes(word));
}

// Auto-search locations map (from your list, N-Z)
const locationMap = {
    'Namibia': 'Windhoek',
    'Nauru': 'Yaren',
    'Nepal': 'Kathmandu',
    'Netherlands': 'Amsterdam',
    'New Zealand': 'Wellington',
    'Nicaragua': 'Managua',
    'Niger': 'Niamey',
    'Nigeria': 'Abuja',
    'North Korea': 'Pyongyang',
    'North Macedonia': 'Skopje',
    'Norway': 'Oslo',
    'Oman': 'Muscat',
    'Pakistan': 'Islamabad',
    'Palau': 'Ngerulmud',
    'Palestine': 'Ramallah',
    'Panama': 'Panama City',
    'Papua New Guinea': 'Port Moresby',
    'Paraguay': 'Asunción',
    'Peru': 'Lima',
    'Philippines': 'Manila',
    'Poland': 'Warsaw',
    'Portugal': 'Lisbon',
    'Qatar': 'Doha',
    'Romania': 'Bucharest',
    'Russia': 'Moscow',
    'Rwanda': 'Kigali',
    'Saint Kitts and Nevis': 'Basseterre',
    'Saint Lucia': 'Castries',
    'Saint Vincent and the Grenadines': 'Kingstown',
    'Samoa': 'Apia',
    'San Marino': 'San Marino',
    'Sao Tome and Principe': 'São Tomé',
    'Saudi Arabia': 'Riyadh',
    'Senegal': 'Dakar',
    'Serbia': 'Belgrade',
    'Seychelles': 'Victoria',
    'Sierra Leone': 'Freetown',
    'Singapore': 'Singapore',
    'Slovakia': 'Bratislava',
    'Slovenia': 'Ljubljana',
    'Solomon Islands': 'Honiara',
    'Somalia': 'Mogadishu',
    'South Africa': 'Pretoria',
    'South Korea': 'Seoul',
    'South Sudan': 'Juba',
    'Spain': 'Madrid',
    'Sri Lanka': 'Colombo',
    'Sudan': 'Khartoum',
    'Suriname': 'Paramaribo',
    'Sweden': 'Stockholm',
    'Switzerland': 'Bern',
    'Syria': 'Damascus',
    'Taiwan': 'Taipei',
    'Tajikistan': 'Dushanbe',
    'Tanzania': 'Dodoma',
    'Thailand': 'Bangkok',
    // Add more if needed from full list
};

module.exports.config = {
    name: 'aria1',
    version: '3.1.0', // Updated with auto-search
    hasPermission: 0,
    usePrefix: false,
    aliases: ['aria', 'opera', 'proai', 'weather'],
    description: "Pro Assistant AI with modes, auto-search weather, AQI, and alerts.",
    usages: "assistant [mode/weather] [prompt/city/country] (auto-searches countries to capitals)",
    credits: 'Betadash API & WeatherAPI (Enhanced with Auto-Search)',
    cooldowns: 0,
    dependencies: { "axios": "" }
};

module.exports.run = async function({ api, event, args }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const uid = event.senderID;
    let input = args.join(' ');
    const maxLength = 600;

    // Detect mode or weather
    const modes = ['general', 'creative', 'analytical', 'storytelling'];
    let mode = 'general';
    if (modes.includes(args[0])) {
        mode = args.shift();
        input = args.join(' ');
    }

    if (!input) {
        return api.sendMessage(`🤖 𝗣𝗿𝗼 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗔𝗜 + 𝗪𝗲𝗮𝘁𝗵𝗲𝗿\n━━━━━━━━━━━━━━\nModes: ${modes.join(', ')}\n\nAsk AI: "assistant creative write a story"\nWeather: "assistant weather Germany" (auto-searches to Berlin)\n\n💡 Tip: Try countries from N-Z for auto-search!`, threadID, messageID);
    }

    if (input.length > maxLength) {
        return api.sendMessage(`⚠️ Input too long! Max ${maxLength} characters.`, threadID, messageID);
    }

    if (hasProfanity(input)) {
        return api.sendMessage("🚫 Inappropriate content detected. Keep it clean!", threadID, messageID);
    }

    // Weather Mode with Auto-Search
    if (input.toLowerCase().startsWith('weather ')) {
        let city = input.slice(8).trim() || "Manila";
        // Auto-search: If input is a country name, resolve to capital
        const countryKey = Object.keys(locationMap).find(key => key.toLowerCase() === city.toLowerCase());
        if (countryKey) {
            city = locationMap[countryKey];
            api.sendMessage(`🔍 Auto-searched: ${countryKey} → ${city}`, threadID, messageID);
        }
        try {
            api.setMessageReaction("🚀", messageID, (err) => err && console.error(err));
            const { data } = await axios.get(
                `https://api.weatherapi.com/v1/forecast.json?key=8d4c6ed946d54f4eb4360142251710&q=${encodeURIComponent(city)}&days=1&aqi=yes&alerts=yes`
            );
            const current = data.current;
            const forecast = data.forecast.forecastday[0].day;
            const alerts = data.alerts.alert || [];
            let reply = `🌤 Weather Forecast for ${data.location.name}, ${data.location.country}\n`;
            reply += `📅 Date: ${data.forecast.forecastday[0].date}\n`;
            reply += `🌡 Current Temp: ${current.temp_c}°C\n`;
            reply += `🌥 Condition: ${current.condition.text}\n`;
            reply += `🌡 Max Temp: ${forecast.maxtemp_c}°C\n`;
            reply += `🌡 Min Temp: ${forecast.mintemp_c}°C\n`;
            reply += `☔ Chance of Rain: ${forecast.daily_chance_of_rain}%\n`;
            reply += `💨 Wind: ${current.wind_kph} kph\n`;
            reply += `🌬 Air Quality (CO): ${current.air_quality.co.toFixed(2)}\n`;
            if (alerts.length > 0) {
                reply += `⚠️ Weather Alerts:\n`;
                alerts.forEach((alert, i) => {
                    reply += `${i + 1}. ${alert.headline} - ${alert.desc}\n`;
                });
            } else {
                reply += `✅ No weather alerts today.`;
            }
            api.setMessageReaction("", messageID, (err) => err && console.error(err));
            return api.sendMessage(reply, threadID, messageID);
        } catch (error) {
            console.error(error);
            api.setMessageReaction("", messageID, (err) => err && console.error(err));
            return api.sendMessage("❌ Failed to fetch weather. Make sure the city/country name is correct or try a capital.", threadID, messageID);
        }
    }

    // AI Mode (unchanged)
    api.sendMessage("🔄 Thinking in Pro Mode...", threadID, messageID);

    try {
        const enhancedPrompt = `[Mode: ${mode}] ${input}`;
        const { data } = await axios.get('https://betadash-api-swordslush-production.up.railway.app/assistant', {
            params: { chat: enhancedPrompt },
            timeout: 15000
        });

        if (!data || !data.response) {
            const retry = await axios.get('https://betadash-api-swordslush-production.up.railway.app/assistant', {
                params: { chat: enhancedPrompt },
                timeout: 15000
            });
            if (!retry || !retry.data.response) {
                return api.sendMessage("⚠️ No response after retry. Please try again later.", threadID, messageID);
            }
            data = retry.data;
        }

        const formattedResponse = data.response
            .replace(/\*\*(.*?)\*\*/g, (_, text) => convertToBold(text))
            .replace(/`(.*?)`/g, (_, code) => `📝 ${code}`)
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^-\s/gm, '• ');

        const dateTime = getPhilippineDateTime();
        const finalMessage = `🤖 𝗣𝗿𝗼 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 (${convertToBold(mode)} Mode)\n━━━━━━━━━━━━━━\n🕒 ${dateTime}\n\n${formattedResponse}\n\n💡 Tip: Try "assistant weather Philippines" for Manila!`;

        return api.sendMessage(finalMessage, threadID, messageID);
    } catch (error) {
        console.error("⛔ Error in Pro Assistant:", error.message || error);
        return api.sendMessage("⛔ An error occurred. Please try again or switch modes.", threadID, messageID);
    }
};
