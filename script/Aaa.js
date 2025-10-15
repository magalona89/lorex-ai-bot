const axios = require('axios');

module.exports.config = {
  name: 'volcbands',
  version: '1.0.0',
  hasPermission: 0,
  usePrefix: true,
  aliases: ['bandapi', 'volcband'],
  description: "Fetches volcano band information from USGS VolcView API",
  usages: "volcbands [active | all | stats | band <name>]",
  credits: 'OpenAI + Kaizenji format',
  cooldowns: 0,
  dependencies: { "axios": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const baseURL = 'https://volcview.wr.usgs.gov/vv-api/bandApi';
  const subCmd = args[0]?.toLowerCase();
  const bandName = args.slice(1).join(' ') || 'Thermal IR';

  let msg = '';
  try {
    switch (subCmd) {
      case 'active': {
        const { data } = await axios.get(`${baseURL}/active`);
        msg = "🟢 ACTIVE BANDS (with images):\n\n";
        data.forEach((b, i) => {
          msg += `${i + 1}. ${b.bandName}\n   Short: ${b.shortName}\n   Desc: ${b.description || 'N/A'}\n   Wavelength: ${b.wavelength || 'N/A'}\n\n`;
        });
        break;
      }

      case 'all': {
        const { data } = await axios.get(`${baseURL}/all`);
        msg = "📋 ALL AVAILABLE BANDS:\n\n";
        data.forEach((b, i) => {
          msg += `${i + 1}. ${b.bandName}\n   Short: ${b.shortName}\n   Desc: ${b.description || 'N/A'}\n   Wavelength: ${b.wavelength || 'N/A'}\n\n`;
        });
        break;
      }

      case 'stats': {
        const { data } = await axios.get(`${baseURL}/stats`);
        msg = "📊 BAND STATS (Totals + Latest Date):\n\n";
        data.forEach((b, i) => {
          msg += `${i + 1}. ${b.bandName}\n   Total Images: ${b.totalImages || 0}\n   Latest: ${b.latestImageDate || 'N/A'}\n\n`;
        });
        break;
      }

      case 'band': {
        const { data } = await axios.get(`${baseURL}/band/${encodeURIComponent(bandName)}`);
        msg = `🔍 BAND DETAILS: ${bandName}\n\n` +
              `🆔 Band ID: ${data.bandId || 'N/A'}\n` +
              `📛 Name: ${data.bandName || 'N/A'}\n` +
              `🔤 Short: ${data.shortName || 'N/A'}\n` +
              `📖 Desc: ${data.description || 'N/A'}\n` +
              `🌈 Wavelength: ${data.wavelength || 'N/A'}\n`;
        break;
      }

      default:
        msg = "🌋 USGS VolcView Band API Commands:\n\n" +
              "• volcbands active — show only active bands with images\n" +
              "• volcbands all — show all available bands\n" +
              "• volcbands stats — show image totals and latest image date\n" +
              "• volcbands band <name> — show info for specific band\n\n" +
              "Example: volcbands band Thermal IR";
        break;
    }

    return api.sendMessage(msg, event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ Error fetching VolcView data:", err.message);
    return api.sendMessage("⚠️ Failed to fetch data from VolcView API.", event.threadID, event.messageID);
  }
};
