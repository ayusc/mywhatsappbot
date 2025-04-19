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

import { translate } from '@vitalets/google-translate-api';

export default {
  name: '.tr',
  description: 'Translates given text or replied message to the specified language.' 
  usage: 'To translate a text type `.tr <language_code> <text>` or reply with `.tr <language_code>`',

  async execute(message, arguments_, client) {
    let langCode = arguments_[0];
    let textToTranslate = arguments_.slice(1).join(' ');

    // Check if replying to a message
    const repliedMessage = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (repliedMessage) {
      if (!repliedMessage.content) {
        return message.reply('❌ Please reply to some text message.');
      }

      // If only `.tr` or `.tr <lang>` is sent in reply, set translation target accordingly
      if (!langCode || (langCode && !textToTranslate)) {
        textToTranslate = repliedMessage.content;

        // Default to English if no language is specified
        langCode = langCode || 'en';
      }
    } else {
      // If not replying to a message and no text provided
      if (!textToTranslate && !langCode) {
        return message.reply('❌ Usage: `.tr <language_code> <text>` or reply with `.tr <language_code>`');
      }

      // If only `.tr` is used without reply or text
      if (!textToTranslate && langCode && langCode.length === 2) {
        return message.reply('❌ Please provide text to translate or reply to a text message.');
      }

      // If only `.tr <text>` is used, treat it as auto-detect and translate to English
      if (!textToTranslate && langCode) {
        textToTranslate = langCode;
        langCode = 'en';
      }
    }

    try {
      const { text } = await translate(textToTranslate, { to: langCode });
      return message.reply(`**Translated (${langCode}):** ${text}`);
    } catch (error) {
      return message.reply('❌ Invalid language code or failed to translate.');
    }
  },
};
