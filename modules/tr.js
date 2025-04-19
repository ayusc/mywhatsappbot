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
  usage: '`.tr <language_code> <text>` or reply with `.tr <language_code>` (defaults to English if no language_code is given)',

  async execute(message, arguments_, client) {
    let langCode = 'en'; // default language
    let textToTranslate;

    // Handle replied messages
    let quoted;
    try {
      quoted = await message.getQuotedMessage();
    } catch (err) {
      quoted = null;
    }

    if (quoted && quoted.body && quoted.type === 'chat') {
      // If command is a reply to a text message
      textToTranslate = quoted.body;

      // If language code is provided like `.tr fr`
      if (arguments_[0] && arguments_[0].length === 2) {
        langCode = arguments_[0];
      }

    } else {
      // Not a reply

      if (arguments_.length === 0) {
        if (quoted && quoted.body && quoted.type != 'chat') {
           return message.reply('❌ Please provide text to translate.');
        } 
        else {
           return message.reply('❌ Usage: `.tr <language_code> <text>` or reply with `.tr <language_code>`');
        }
      }

      if (arguments_[0].length === 2) {
        langCode = arguments_[0];
        textToTranslate = arguments_.slice(1).join(' ');

        if (!textToTranslate) {
          return message.reply('❌ Please provide text to translate.');
        }
      } else {
        // No language code, assume default 'en'
        textToTranslate = arguments_.join(' ');
      }
    }

    try {
      const result = await translate(textToTranslate, { to: langCode });
      const fromLang = result.raw.src;

      return message.reply(`*Translated from ${fromLang} to ${langCode}:*\n\n${result.text}`);
    } catch (error) {
      console.error(error);
      return message.reply('❌ Failed to translate. Please check the language code or try again.');
    }
  },
};
