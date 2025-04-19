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
  description: 'Translates given text or replied message to the specified language.',
  usage: 'To translate a text type `.tr <language_code> <text>` or reply with `.tr <language_code>` (if no language_code is given, auto-detects and translates to English)',

  async execute(message, arguments_, client) {
    let langCode;
    let textToTranslate;

    const repliedMessage = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    // Case 1: Message is a reply
    if (repliedMessage && repliedMessage.content) {
      textToTranslate = repliedMessage.content;

      // `.tr` or `.tr <lang>` (default to 'en' if lang not provided)
      langCode = arguments_[0] || 'en';
    } else {
      // Case 2: Message is not a reply

      if (arguments_.length === 0) {
        return message.reply('❌ Usage: `.tr <language_code> <text>` or reply with `.tr <language_code>`');
      }

      // If the first argument is a valid language code (2 letters), assume it's a code
      if (arguments_[0].length === 2) {
        langCode = arguments_[0];
        textToTranslate = arguments_.slice(1).join(' ');
        if (!textToTranslate) {
          return message.reply('❌ Please provide text to translate.');
        }
      } else {
        // No lang code provided, default to English
        langCode = 'en';
        textToTranslate = arguments_.join(' ');
      }
    }

    try {
      const result = await translate(textToTranslate, { to: langCode });
      const fromLang = result.from.language.iso;

      return message.reply(`*Translated from ${fromLang} to ${langCode}:*\n\n${result.text}`);
    } catch (error) {
      console.error(error);
      return message.reply('❌ Invalid language code or failed to translate.');
    }
  },
};
