module.exports = {
  config: {
    name: "post",
    aliases: [],
    shortDescription: { en: "📝 Post a message" },
    longDescription: { en: "Post a custom message using the bot." },
    category: "utility",
    usage: "post <message>",
    version: "2.0.0",
    role: 2,
    author: "opensi",
    cooldowns: 0
  },

  onStart: async function ({ api, event, args, message }) {
    const content = args.join(" ").trim();
    const replyToId = event.messageID;

    if (!content) {
      return message.reply("⚠️ Please enter a message to post.");
    }

    try {
      api.createPost(content); // Assuming this is a valid method in your framework
      message.reply("✅ Post successful!");
    } catch (error) {
      console.error("Post command error:", error);
      message.reply("❌ Failed to post. Please try again!");
    }
  }
};
