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


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandFiles = fs.readdirSync(__dirname).filter(file =>
  file.endsWith('.js') && file !== 'help.js'
);

for (const file of commandFiles) {
  const filePath = path.join(__dirname, file);
  const { default: command } = await import(`file://${filePath}`);
  if (command?.name && command?.description) {
    commands.push(command);
  }
}

export default {
  name: '.help',
  description: 'Lists all commands or shows usage for a specific command',

  async execute(message, args, client) {
    const prefix = '.';

    if (args.length > 0) {
      const query = prefix + args[0];
      const command = commands.find(cmd => cmd.name === query);

      if (!command) {
        return await message.reply(`❌ Command not found: ${query}`);
      }

      const usage = command.usage || command.description;
      return await message.reply(`*Usage for ${command.name}:*\n\n${usage}`);
    }

    // Generate help list
    let replyMsg = `*Welcome to WahBuddy - A userbot for WhatsApp written in pure JavaScript*\n\n` +
                   `Here are all the bot commands:\n` +
                   `To know command usage please type \`.help {command}\`\n\n`;

    for (const cmd of commands) {
      replyMsg += `\`${cmd.name}\`: ${cmd.description}\n\n`;
    }

    await message.reply(replyMsg.trim());
  },
};
