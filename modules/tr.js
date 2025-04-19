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
  usage: 'To translate a text type `.tr <language_code> <text>` or reply with `.tr <language_code>` (if no language_code is given auto detects the replied text and translates to english)',

  async execute(message, arguments_, client) {
    let langCode = arguments_[0];
    let textToTranslate = arguments_.slice(1).join(' ');

    const repliedMessage = message.reference
      ? await message.channel.messages.fetch(message.reference.messageId)
      : null;

    if (repliedMessage) {
      if (!repliedMessage.content) {
        return message.reply('❌ Please reply to a text message.');
      }

      textToTranslate = repliedMessage.content;

      // If only `.tr` is used
      if (!langCode || (langCode && !textToTranslate.trim())) {
        langCode = 'en';
      }
    } else {
      if (!textToTranslate && !langCode) {
        return message.reply('❌ Usage: `.tr <language_code> <text>` or reply with `.tr <language_code>`');
      }

      if (!textToTranslate && langCode && langCode.length === 2) {
        return message.reply('❌ Please provide text to translate or reply to a text message.');
      }

      if (!textToTranslate && langCode) {
        textToTranslate = langCode;
        langCode = 'en';
      }
    }

    try {
      const result = await translate(textToTranslate, { to: langCode });
      const fromLang = result.from.language.iso;

      return message.reply(`*Translated from ${fromLang} to ${langCode}:*\n\n${result.text}`);
    } catch (error) {
      console.log('Error during translation:', err);
      return message.reply('❌ Invalid language code or failed to translate.');
    }
  },
};
