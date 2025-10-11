module.exports = {
  config: {
    name: "novainfo",
    version: "1.1",
    author: "manuelson",
    countDown: 0,
    role: 0,
    shortDescription: "Show Nova AI information, privacy policy, and rules",
    longDescription: "Displays the about info, privacy policy, user rules, and terms of use for Nova AI",
    category: "info",
    guide: "{p}terms"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    const message = `
🤖 𝗔𝗕𝗢𝗨𝗧 𝗡𝗢𝗩𝗔 𝗔𝗜
Nova is an advanced AI chatbot powered by GPT-5 — the latest generation of language models by OpenAI. Nova is designed to assist with questions, generate creative content, play media, and interact intelligently with users in real time.

📜 𝗡𝗼𝘃𝗮 𝗔𝗜 - 𝗧𝗲𝗿𝗺𝘀 𝗼𝗳 𝗨𝘀𝗲 & 𝗣𝗿𝗶𝘃𝗮𝗰𝘆 𝗣𝗼𝗹𝗶𝗰𝘆

🔒 𝗣𝗿𝗶𝘃𝗮𝗰𝘆 𝗣𝗼𝗹𝗶𝗰𝘆:
- We do not collect or store your personal data.
- Messages are processed in real time and not saved.
- Media/files are deleted automatically after being processed.

📘 𝗧𝗲𝗿𝗺𝘀 𝗼𝗳 𝗨𝘀𝗲:
- Do not use Nova AI for illegal, harmful, or abusive purposes.
- Do not spam commands or attempt to exploit the bot.
- Downtime may occur due to maintenance or API limits.

⚠️ 𝗨𝘀𝗲𝗿 𝗥𝘂𝗹𝗲𝘀:
1. Be respectful to Nova and the developers.
2. No NSFW, hate speech, or violent content.
3. Rule violations may result in warnings or bans.

💬 𝗦𝘂𝗽𝗽𝗼𝗿𝘁:
For help, feedback, or bug reports, please contact the admin or developer.

📌 Thank you for using Nova AI responsibly. Stay smart, stay safe.
    `;

    return api.sendMessage(message, threadID, messageID);
  }
};
