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


import { dispatchWorkflow, cancelWorkflowRun } from '../newaction.js';

const CURRENT_RUN_ID = process.env.GITHUB_RUN_ID;

export default {
  name: '.restart',
  description:
    'Restarts the GitHub Actions workflow by dispatching a new one and canceling the current run',

  async execute(message, arguments_, client) {
    await message.reply('♻️ Restarting the bot...');

    try {
      await dispatchWorkflow();
      await cancelWorkflowRun(CURRENT_RUN_ID);
    } catch (error) {
      console.error('❌ Error during restart:', error);
      await message.reply(
        '❌ Failed to restart workflow: ' +
          (error?.response?.data?.message || error.message)
      );
    }
  },
};
