const axios = require('axios');
const moment = require('moment-timezone');

function convertToBold(text) {
  const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
    'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
    'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
    'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
    'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
    'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
    'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  };

  return text.split('').map(char => boldMap[char] || char).join('');
}

module.exports.run = async function({ api, event, args }) {
  const input = args.join(' ');
  const uid = event.senderID;

  // Get current time in PH timezone
  const phTime = moment().tz('Asia/Manila').format('MMMM D, YYYY (dddd) — h:mm A');

  const isPhoto = event.type === "message_reply" &&
                  event.messageReply?.attachments &&
                  event.messageReply.attachments[0]?.type === "photo";

  if (isPhoto) {
    const photoUrl = event.messageReply.attachments[0].url;

    if (!input) {
      return api.sendMessage(
        `📸 𝗣𝗮𝗸𝗶𝗹𝗮𝗴𝗮𝘆 𝗻𝗴 𝗽𝗿𝗼𝗺𝗽𝘁 𝗸𝗮𝘀𝗮𝗯𝗮𝘆 𝗻𝗴 𝗹𝗮𝗿𝗮𝘄𝗮𝗻.\nExample: "ai describe this image"`,
        event.threadID,
        event.messageID
      );
    }

    api.sendMessage(`🧠 GPT-5 Vision is analyzing the image...\n⏰ **PH Time:** ${phTime}`, event.threadID, event.messageID);

    try {
      const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/gemini-vision', {
        params: {
          q: input,
          uid: uid,
          imageUrl: photoUrl,
          apikey: 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7'
        }
      });

      if (data?.response) {
        return api.sendMessage(`📤 𝗥𝗲𝘀𝘂𝗹𝘁:\n\n${data.response}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage("⚠️ Unexpected response format from the image analysis API.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("Error processing image analysis request:", error.message || error);
      return api.sendMessage("❌ An error occurred while processing the image. Please try again.", event.threadID, event.messageID);
    }
  }

  if (!input) {
    return api.sendMessage("❌ 𝗣𝗮𝗸𝗶 𝗹𝗮𝗴𝗮𝘆 𝗻𝗴 𝗽𝗿𝗼𝗺𝗽𝘁. Example: ai What is quantum physics?", event.threadID, event.messageID);
  }

  api.sendMessage(`🤖 GPT-5 is thinking...\n⏰ **PH Time:** ${phTime}`, event.threadID, event.messageID);

  try {
    const { data } = await axios.get('https://kaiz-apis.gleeze.com/api/gemini-flash-2.0', {
      params: {
        q: input,
        uid: uid,
        apikey: 'acb7e0e8-bbc3-4697-bf64-1f3c6231dee7'
      }
    });

    if (!data?.response) {
      return api.sendMessage("😕 I didn’t quite catch that. Could you try again?", event.threadID, event.messageID);
    }

    const formattedResponse = data.response
      .replace(/\*\*(.*?)\*\*/g, (_, text) => convertToBold(text))
      .replace(/##(.*?)##/g, (_, text) => convertToBold(text))
      .replace(/^###\s*/gm, '')
      .replace(/\n{3,}/g, '\n\n');

    const fullMessage = `✅ 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲\n⏰ **Date & Time:** ${phTime}\n\n${formattedResponse}`;

    return api.sendMessage(fullMessage, event.threadID, event.messageID);
  } catch (error) {
    console.error("⛔ Error:", error.message || error);
    return api.sendMessage("⛔ Error processing your request. Please try again.", event.threadID, event.messageID);
  }
};
