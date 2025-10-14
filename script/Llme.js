const axios = require("axios");

module.exports.config = {
  name: "aiml",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["askaiml", "chatgpt"],
  description: "Ask AIML (like GPT-4o) any question",
  usages: "aiml <your question>",
  credits: "Converted by OpenAI",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const userPrompt = args.join(" ");
  const apiKey = "74a02abfccdb409f9bd5963480285f65"; // 🚨 Replace if regenerated
  const baseURL = "https://api.aimlapi.com/v1";

  if (!userPrompt) {
    return api.sendMessage("❌ Please provide a message to send to AIML.\n\nExample:\naiml What is the capital of Japan?", event.threadID, event.messageID);
  }

  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error("❌ AIML API Error:", error?.response?.data || error.message);
    return api.sendMessage("❌ Error while contacting AIML API. Try again later.", event.threadID, event.messageID);
  }
};
