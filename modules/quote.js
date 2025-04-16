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
    "Creates a quote sticker from a replied message and following messages",

  async execute(msg, args, client) {
    if (!msg.hasQuotedMsg) {
      return msg.reply("Please reply to a text message to quote.");
    }

    const quotedMsg = await msg.getQuotedMessage();
    if (!quotedMsg.body || quotedMsg.type !== "chat") {
      return msg.reply("Please reply to some text message.");
    }

    let count = 1;
    if (args[0]) {
      const n = parseInt(args[0]);
      if (isNaN(n) || n < 1 || n > 5) {
        return msg.reply("Please enter a valid number between 1 and 5.");
      }
      count = n;
    }

    const nextMessages = await getNextTextMessages(msg, quotedMsg, count - 1);
    const allMessages = [quotedMsg, ...nextMessages];

    const formatted = await Promise.all(
      allMessages.map(async (m, idx) => {
        if (!m.body || m.type !== "chat") return null;

        const contact = await m.getContact();
        const name = contact.pushname || contact.number;
        const avatarUrl = await getProfilePicUrl(contact);

        const replyMsg = m.hasQuotedMsg ? await m.getQuotedMessage() : null;

        if (replyMsg && (!replyMsg.body || replyMsg.type !== "chat")) {
          return msg.reply(
            "One of the messages is replying to non-text. Cannot generate quote.",
          );
        }

        const replyData = replyMsg
          ? {
              id: idx + 100,
              text: replyMsg.body,
              from: {
                name:
                  (await replyMsg.getContact()).pushname ||
                  (await replyMsg.getContact()).number,
                photo: {
                  url: await getProfilePicUrl(await replyMsg.getContact()),
                },
              },
            }
          : {};

        return {
          entities: [],
          avatar: true,
          from: {
            id: idx + 1,
            name,
            photo: { url: avatarUrl },
          },
          text: m.body,
          replyMessage: replyMsg ? replyData : {},
        };
      }),
    );

    const messagesToSend = formatted.filter(Boolean);

    const quoteJson = {
      type: "quote",
      format: "png",
      backgroundColor: "#FFFFFF",
      width: 512,
      height: 512,
      scale: 2,
      messages: messagesToSend,
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

      const sticker = await MessageMedia.fromFilePath(filePath);
      const chat = await msg.getChat();

      await client.sendMessage(chat.id._serialized, sticker, {
        sendMediaAsSticker: true,
        stickerAuthor: "Ayus Chatterjee",
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error generating quote:", err);
      msg.reply("Failed to generate quote.");
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

async function getNextTextMessages(msg, quotedMsg, limit) {
  const chat = await msg.getChat();
  const allMsgs = await chat.fetchMessages({ limit: limit + 6 });
  const startIdx = allMsgs.findIndex((m) => m.id.id === quotedMsg.id.id);

  if (startIdx === -1) return [];

  const following = allMsgs.slice(startIdx + 1, startIdx + 1 + limit);
  return following.filter((m) => m.body && m.type === "chat");
}
