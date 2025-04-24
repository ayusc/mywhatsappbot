//  WahBuddy - A simple whatsapp userbot written in pure js
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


import fetch from 'node-fetch';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;

if (!OCR_SPACE_API_KEY) {
  throw new Error('Your OCR_SPACE_API_KEY is not set. Please set it first.');
}

export default {
  name: '.ocr',
  description: 'Extracts text from an image using OCR',
  usage:
    '.ocr <lang> in reply to a image.\nIf no language is provided defaults to english or eng.',

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
      const imageBuffer = Buffer.from(media.data, 'base64');

      const formData = new FormData();
      
      formData.append('apikey', OCR_SPACE_API_KEY);
      formData.append('language', lang);
      formData.append('OCREngine', '2');
      formData.append('detectOrientation', 'true');
      formData.append('isOverlayRequired', 'false');
      formData.append('scale', 'true');
      
      formData.append(
        'file',
        new Blob([imageBuffer], { type: media.mimetype }),
        'image.png'
      );

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        const message =
          result.ErrorMessage?.[0] || 'Unknown OCR processing error.';
        await reply.edit(`❌ Error while performing OCR: ${message}`);
        return;
      }

      const parsedText = result.ParsedResults?.[0]?.ParsedText?.trim();

      await (parsedText
        ? reply.edit(`📃 OCR Result:\n\n${parsedText}`)
        : reply.edit('❌ No readable text found in the image.'));
    } catch (error) {
      console.error('OCR error:', error);
      await new Promise(r => setTimeout(r, 3000));
      await reply.edit(
        '❌ OCR failed to convert the given image to text.'
      );
    }
  },
};
