// Thanks for the quotes API
// https://github.com/LyoSU/quote-api

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "whatsapp-web.js";
const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: ".quote",
  description:
    "Creates a quote sticker from a message and the next few (up to 5)",

  async execute(msg, args, client) {
    if (!msg.hasQuotedMsg) {
      return msg.reply("Please reply to a text message.");
    }

    const quoted = await msg.getQuotedMessage();

    if (!quoted.body || quoted.type !== "chat") {
      return msg.reply("Please reply to a text message.");
    }

    // Determine number of messages to include
    let count = 1;
    if (args[0]) {
      if (!/^[1-5]$/.test(args[0])) {
        return msg.reply("Please provide a number between 1 and 5.");
      }
      count = parseInt(args[0]);
    }

    const useNumberAsName = args.includes("noname");

    const chat = await msg.getChat();
    const allMsgs = await chat.fetchMessages({ limit: 30 });
    const startIdx = allMsgs.findIndex((m) => m.id.id === quoted.id.id);
    if (startIdx === -1)
      return msg.reply("Could not find the message sequence.");

    const slice = allMsgs.slice(startIdx, startIdx + count);

    const messages = await Promise.all(
      slice.map(async (m, i) => {
        const contact = await m.getContact();
        const name = useNumberAsName
          ? `+${contact.id.user}`
          : contact.pushname || contact.name || contact.number;
        const avatar = await getProfilePicUrl(contact);

        let replyMessage;

        if (m.hasQuotedMsg) {
          try {
            const replyData = await m.getQuotedMessage();
            if (replyData && replyData.type === "chat" && replyData.body) {
              const replyContact = await replyData.getContact();
              replyMessage = {
                name: useNumberAsName
                  ? `+${replyContact.id.user}`
                  : replyContact.pushname ||
                    replyContact.name ||
                    replyContact.number,
                text: replyData.body,
                entities: [],
                chatId: 123456789, // arbitrary
              };
            }
          } catch (e) {
            // ignore errors silently if quoted msg couldn't be fetched
          }
        }

        return {
          entities: [],
          avatar: true,
          from: {
            id: i + 1,
            name: name,
            photo: { url: avatar },
          },
          text: m.body || "",
          replyMessage,
        };
      }),
    );

    const quoteJson = {
      type: "quote",
      format: "png",
      backgroundColor: "#FFFFFF",
      width: 512,
      height: 512,
      scale: 2,
      messages,
    };

    try {
      const res = await axios.post(
        "https://bot.lyo.su/quote/generate",
        quoteJson,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const buffer = Buffer.from(res.data.result.image, "base64");
      const filePath = path.join(__dirname, "quote.png");
      fs.writeFileSync(filePath, buffer);

      const media = await MessageMedia.fromFilePath(filePath);
      const chat = await msg.getChat();

      await client.sendMessage(chat.id._serialized, media, {
        sendMediaAsSticker: true,
        stickerAuthor: "Ayus Chatterjee",
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Quote generation error:", err);
      msg.reply("Something went wrong while generating the quote.");
    }
  },
};

async function getProfilePicUrl(contact) {
  try {
    return (
      (await contact.getProfilePicUrl()) ||
      "https://i.ibb.co/d4qcHwdj/blank-profile-picture-973460-1280.png"
    );
  } catch {
    return "https://i.ibb.co/d4qcHwdj/blank-profile-picture-973460-1280.png";
  }
}
