const axios = require("axios");

module.exports.config = {
  name: "comet",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["askcomet", "cometchat"],
  description: "Ask the CometAI Chat model (like ChatGPT)",
  usages: "comet <your message>",
  credits: "OpenAI",
  cooldowns: 0,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function({ api, event, args }) {
  const userPrompt = args.join(" ");
  const apiKey = "sk-2OH246bUZjsaQUwl3Dx40AyndtTt2mqOFRKqCNGJh6enbjF0"; // ❌ Regenerate after reading this
  const baseUrl = "https://api.cometapi.com/v1/chat/completions";

  if (!userPrompt) {
    return api.sendMessage("❌ Please provide a message to send to Comet.\n\nExample:\ncomet What is the capital of France?", event.threadID, event.messageID);
  }

  try {
    api.setMessageReaction("💬", event.messageID, () => {}, true);

    const response = await axios.post(baseUrl, {
      model: "gpt-3.5-turbo", // Or another model Comet supports
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    const reply = response.data.choices[0].message.content;

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    return api.sendMessage(reply, event.threadID, event.messageID);

  } catch (error) {
    console.error("Comet API Error:", error?.response?.data || error.message);
    return api.sendMessage("❌ Failed to get a response from Comet API.", event.threadID, event.messageID);
  }
};
