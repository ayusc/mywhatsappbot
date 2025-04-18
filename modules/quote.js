//  Whatsappbot - A simple whatsapp userbot written in pure js
//  Copyright (C) 2025-present Ayus Chatterjee
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.

//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Thanks for the quotes API
// https://github.com/LyoSU/quote-api

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import pkg from 'whatsapp-web.js';

const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: '.quote',
  description:
    'Creates a quote sticker from a message and the next few (up to 5)',

  async execute(message, arguments_, client) {
    if (!message.hasQuotedMsg) {
      return message.reply('Please reply to a text message.');
    }

    const quoted = await message.getQuotedMessage();

    if (!quoted.body || quoted.type !== 'chat') {
      return message.reply('Please reply to a text message.');
    }

    // Determine number of messages to include
    let count = 1;
    if (arguments_[0]) {
      if (!/^[1-5]$/.test(arguments_[0])) {
        return message.reply('Please provide a number between 1 and 5.');
      }

      count = Number.parseInt(arguments_[0]);
    }

    const useNumberAsName = arguments_.includes('noname');

    const chat = await message.getChat();
    const allMsgs = await chat.fetchMessages({ limit: 20 });
    const startIndex = allMsgs.findIndex(m => m.id.id === quoted.id.id);
    if (startIndex === -1)
      return message.reply('Could not find the message sequence.');

    const slice = allMsgs
      .slice(startIndex)
      .filter(m => m.type === 'chat' && m.body)
      .slice(0, count);

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
            if (replyData && replyData.type === 'chat' && replyData.body) {
              const replyContact = await replyData.getContact();
              replyMessage = {
                name: useNumberAsName
                  ? `+${replyContact.id.user}`
                  : replyContact.pushname ||
                    replyContact.name ||
                    replyContact.number,
                text: replyData.body,
                entities: [],
                chatId: 123_456_789, // Arbitrary
              };
            }
          } catch {
            // ignore errors silently if quoted msg couldn't be fetched
          }
        }

        return {
          entities: [],
          avatar: true,
          from: {
            id: i + 1,
            name,
            photo: { url: avatar },
          },
          text: m.body || '',
          replyMessage,
        };
      })
    );

    const quoteJson = {
      type: 'quote',
      format: 'png',
      backgroundColor: '#FFFFFF',
      width: 512,
      height: 512,
      scale: 2,
      messages,
    };

    try {
      const res = await axios.post(
        'https://bot.lyo.su/quote/generate',
        quoteJson,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const buffer = Buffer.from(res.data.result.image, 'base64');
      const filePath = path.join(__dirname, 'quote.png');
      fs.writeFileSync(filePath, buffer);

      const media = await MessageMedia.fromFilePath(filePath);
      const chat = await message.getChat();

      await client.sendMessage(chat.id._serialized, media, {
        sendMediaAsSticker: true,
        stickerAuthor: 'Ayus Chatterjee',
      });

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Quote generation error:', error);
      message.reply('Something went wrong while generating the quote.');
    }
  },
};

async function getProfilePicUrl(contact) {
  try {
    return (
      (await contact.getProfilePicUrl()) ||
      'https://i.ibb.co/d4qcHwdj/blank-profile-picture-973460-1280.png'
    );
  } catch {
    return 'https://i.ibb.co/d4qcHwdj/blank-profile-picture-973460-1280.png';
  }
}
