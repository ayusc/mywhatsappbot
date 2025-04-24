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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Required for resolving __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const RMBG_API_KEY = process.env.RMBG_API_KEY;

if (!RMBG_API_KEY) {
  throw new Error('Your RMBG_API_KEY is not set. Please set it first.');
}

export default {
  name: '.rmbg',
  description: 'Removes background from an image using remove.bg',
  usage: '.rmbg in reply to an image',

  async execute(message, arguments_, client) {
    if (!message.hasQuotedMsg) {
      return await message.reply('❌ Please reply to an image to remove its background.');
    }

    const quotedMessage = await message.getQuotedMessage();

    if (!quotedMessage.hasMedia) {
      return await message.reply('❌ Please reply to a valid image.');
    }

    const media = await quotedMessage.downloadMedia();

    if (!media || media.mimetype.split('/')[0] !== 'image') {
      return await message.reply('❌ The replied message is not a valid image.');
    }

    try {
      const imageBuffer = Buffer.from(media.data, 'base64');

      const formData = new FormData();
      formData.append('image_file', imageBuffer, {
        filename: 'image.png',
        contentType: media.mimetype,
      });

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': RMBG_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Remove.bg error:', errorBody);
        return await message.reply(`❌ Failed to remove background: ${response.statusText}`);
      }

      const buffer = await response.buffer();

      // Save to temporary file
      const filePath = path.join(__dirname, 'rmbg.png');
      fs.writeFileSync(filePath, buffer);
      const rmbgimg = await MessageMedia.fromFilePath(filePath);
      await message.reply(rmbgimg);
      
      // Clean up
      fs.unlinkSync(filePath);
      
    } catch (error) {
      console.error('Background removal error:', error);
      await message.reply('❌ Failed to remove background from the image.');
    }
  },
};
