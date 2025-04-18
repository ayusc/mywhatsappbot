#  whatsappbot - A simple whatsapp userbot written in pure js
#  Copyright (C) 2025-present Ayus Chatterjee
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.

#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.

#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <https://www.gnu.org/licenses/>.


import { interval } from './autobio.js';

export default {
  name: '.stopbio',
  description: 'Stop updating WhatsApp "About" automatically.',

  async execute(message) {
    if (interval) {
      clearInterval(interval);
      globalThis.interval = null;
      await message.reply('🛑 AutoBio stopped.');
      await message.delete(true, true);
    } else {
      await message.reply('ℹ️ AutoBio is not running.');
      await message.delete(true, true);
    }
  },
};
