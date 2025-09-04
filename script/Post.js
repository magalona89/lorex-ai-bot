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
    author: "Prince",
    cooldowns: 0
  },

  onStart: async function ({ api, event, args, message }) {
    const content = args.join(" ").trim();

    if (!content) {
      return message.reply("⚠️ Please enter a message to post.");
    }

    try {
      // If you're using Facebook-based bot, api.createPost may not exist.
      // Replace this with your own logic if needed, or remove.
      if (typeof api.createPost === "function") {
        await api.createPost(content);
      }

      return message.reply("✅ Post successful!");
    } catch (error) {
      console.error("Post command error:", error);
      return message.reply("❌ Failed to post. Please try again!");
    }
  }
};
