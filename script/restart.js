const fs = require("fs-extra");

module.exports.config = {
  name: "restart",
  version: "1.1",
  author: "NTKhang",
  countDown: 5,
  role: 2,
  description: {
    vi: "Khởi động lại bot",
    en: "Restart bot"
  },
  category: "Owner",
  guide: {
    vi: "{pn}: Khởi động lại bot",
    en: "{pn}: Restart bot"
  }
};

module.exports.langs = {
  vi: {
    restarting: "🔄 | Đang khởi động lại bot..."
  },
  en: {
    restarting: "🔄 | Restarting bot..."
  }
};

module.exports.onLoad = async function ({ api }) {
  const pathFile = `${__dirname}/tmp/restart.txt`;
  if (fs.existsSync(pathFile)) {
    const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
    api.sendMessage(`✅ | Bot restarted\n⏰ | Time: ${(Date.now() - time) / 1000}s`, tid);
    fs.unlinkSync(pathFile);
  }
};

module.exports.run = async function ({ api, event, message, getLang }) {
  const pathFile = `${__dirname}/tmp/restart.txt`;
  fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
  await message.reply(getLang("restarting"));
  process.exit(2);
};
