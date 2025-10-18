const axios = require('axios');

// Bold text converter
function convertToBold(text) {
    const boldMap = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    };
    return text.split('').map(char => boldMap[char] || char).join('');
}

// Get Philippine date/time
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

// Profanity filter
function hasProfanity(text) {
    const badWords = ['badword1', 'badword2']; // Customize
    return badWords.some(word => text.toLowerCase().includes(word));
}

// Location map (partial for N-Z countries; add more if needed)
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
};

module.exports.config = {
    name: 'assistant',
    version: '3.2.0',
    hasPermission: 0,
    usePrefix: false,
    aliases: ['ai', 'betadash', 'proai', 'aiweather'],
    description: "Pro Assistant AI with modes, auto-search weather, TTS, AQI, and alerts.",
    usages: "assistant [mode/weather/tts] [prompt/city/country/text] (TTS sends voice audio)",
    credits: 'Betadash API, WeatherAPI & Typecast AI (Fully Integrated)',
    cooldowns: 3,
    dependencies: { "axios": "" }
};

module.exports.run = async function({ api, event, args }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const uid = event.senderID;
    let input = args.join(' ');
    const maxLength = 600;

    // Detect mode or weather or TTS
    const modes = ['general', 'creative', 'analytical', 'storytelling'];
    let mode = 'general';
    if (modes.includes(args[0]) || args[0] === 'tts') {
        mode = args.shift();
        input = args.join(' ');
    }

    if (!input) {
        return api.sendMessage(`🤖 𝗣𝗿𝗼 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁 𝗔𝗜 + 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 + 𝗧𝗧𝗦\n━━━━━━━━━━━━━━\nModes: ${modes.join(', ')}, tts\n\nAsk AI: "assistant creative write a story"\nWeather: "assistant weather Germany" (auto-searches)\nTTS: "assistant tts Hello, how are you?" (sends voice audio)\n\n💡 Tip: TTS really sends audio files!`, threadID, messageID);
    }

    if (input.length > maxLength) {
        return api.sendMessage(`⚠️ Input too long! Max ${maxLength} characters.`, threadID, messageID);
    }

    if (hasProfanity(input)) {
        return api.sendMessage("🚫 Inappropriate content detected. Keep it clean!", threadID, messageID);
    }

    // TTS Mode: Send voice audio
    if (mode === 'tts') {
        api.sendMessage("🔄 Generating voice...", threadID, messageID);
        try {
            const response = await axios.post('https://api.typecast.ai/v1/text-to-speech', {
                voice_id: 'tc_689450bdcce4027c2f06eee8', // Your voice ID
                text: input,
                model: 'ssfm-v21',
                language: 'eng',
                prompt: {
                    emotion_preset: 'normal',
                    emotion_intensity: 1
                },
                output: {
                    volume: 100,
                    audio_pitch: 0,
                    audio_tempo: 1,
                    audio_format: 'wav'
                },
                seed: 42
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': '__pltZDWr3TD2a4kJ88pKmP4rQNfYEQzM72WS5NpEtkg7' // Your API key
                },
                timeout: 30000
            });

            if (!response.data || !response.data.audio_url) {
                return api.sendMessage("⚠️ Failed to generate audio. No audio URL returned.", threadID, messageID);
            }

            const audioUrl = response.data.audio_url;
            const audioStream = await axios.get(audioUrl, { responseType: 'stream' });
            const dateTime = getPhilippineDateTime();

            return api.sendMessage({
                body: `🎤 𝗧𝗧𝗦 𝗔𝘂𝗱𝗶𝗼\n━━━━━━━━━━━━━━\n🕒 ${dateTime}\n\nText: "${input}"\nVoice: Typecast AI\n\n(Audio attached below)`,
                attachment: audioStream.data
            }, threadID, messageID);

        } catch (error) {
            console.error("⛔ Error in TTS:", error.message || error);
            return api.sendMessage("⛔ An error occurred while generating voice. Please try again.", threadID, messageID);
        }
    }

    // Weather Mode with Auto-Search
    if (input.toLowerCase().startsWith('weather ')) {
        let city = input.slice(8).trim() || "Manila";
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
            return api.sendMessage("❌ Failed to fetch weather. Make sure the city/country name is correct.", threadID, messageID);
        }
    }

    // AI Mode
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
        const finalMessage = `🤖 𝗣𝗿𝗼 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 (${convertToBold(mode)} Mode)\n━━━━━━━━━━━━━━\n🕒 ${dateTime}\n\n${formattedResponse}\n\n💡 Tip: Try "assistant tts [text]" for voice audio!`;

        return api.sendMessage(finalMessage, threadID, messageID);
    } catch (error) {
        console.error("⛔ Error in Pro Assistant:", error.message || error);
        return api.sendMessage("⛔ An error occurred. Please try again or switch modes.", threadID, messageID);
    }
};
