//  whatsappbot - A simple whatsapp userbot written in pure js
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


import { createWorker } from 'tesseract.js';

export default {
  name: '.ocr',
  description: 'Extracts text from an image using OCR',

  async execute(message, arguments_, client) {
    if (!message.hasQuotedMsg) {
      return await message.reply(
        '❌ Please reply to some image containing text.'
      );
    }

    const quotedMessage = await message.getQuotedMessage();

    if (!quotedMessage.hasMedia) {
      return await message.reply(
        '❌ Please reply to an image containing text.'
      );
    }

    const lang = arguments_[0] || 'eng'; // Default to English if no language is given
    const media = await quotedMessage.downloadMedia();

    if (!media || media.mimetype.split('/')[0] !== 'image') {
      return await message.reply(
        '❌ The replied message is not a valid image.'
      );
    }

    const reply = await message.reply(
      `🔍 Processing image using language \`${lang}\`...`
    );

    try {
      const worker = await createWorker(lang);
      const buffer = Buffer.from(media.data, 'base64');

      const {
        data: { text },
      } = await worker.recognize(buffer);

      await worker.terminate();

      const cleanText =
        text.trim() || '❌ No readable text found in the image.';

      await reply.edit(`📃 OCR Result:\n\n${cleanText}`);
    } catch (error) {
      console.error('OCR error:', error);
      await reply.edit(
        '❌ Error while performing OCR. Make sure the language code is valid.'
      );
    }
  },
};
