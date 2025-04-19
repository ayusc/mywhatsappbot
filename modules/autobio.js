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

let interval = null;
let lastQuote = '';
dotenv.config();

export const autobioInterval = () => interval;

async function runQuoteUpdate() {
  try {
    let quote = '';
    let attempts = 0;

    while (quote.length === 0 || quote.length > 139 || quote === lastQuote) {
      const res = await fetch('https://quotes-api-self.vercel.app/quote');
      const data = await res.json();
      quote = `${data.quote} —${data.author}`;
      // Console.log(`Fetched quote: "${quote}"`);
      attempts++;

      if (attempts >= 10) {
        console.warn(
          '⚠️ Failed to find a new short quote after 10 attempts. Skipping...'
        );
        return null;
      }
    }

    lastQuote = quote;
    return quote;
  } catch (error) {
    console.error('❌ Error fetching quote:', error.message);
    return null;
  }
}

export default {
  name: '.autobio',
  description:
    'Start updating WhatsApp "About" with motivational quotes every X seconds (default 60s)',

  async execute(message, arguments_, client) {
    const AUTO_BIO_INTERVAL = process.env.AUTO_BIO_INTERVAL_MS || 60_000;

    if (interval) {
      await message.reply('⚠️ AutoBio is already running!');
      return;
    }

    await message.reply(
      `✅ AutoBio started.\nUpdating every ${AUTO_BIO_INTERVAL / 1000}s`
    );

    const now = Date.now();
    const nextAligned = Math.ceil(now / AUTO_BIO_INTERVAL) * AUTO_BIO_INTERVAL;
    const delay = nextAligned - now;

    setTimeout(async () => {
      const quote = await runQuoteUpdate();
      if (quote) {
        try {
          await client.setStatus(quote);
          console.log(`✅ About updated`);
        } catch (error) {
          console.error(
            '❌ Failed to set initial About status:',
            error.message
          );
        }
      }

      interval = setInterval(async () => {
        const quote = await runQuoteUpdate();
        if (quote) {
          try {
            await client.setStatus(quote);
            console.log(`✅ About updated`);
          } catch (error) {
            console.error('❌ Failed to update About:', error.message);
          }
        }
      }, AUTO_BIO_INTERVAL);
    }, delay);
  },
};

export { interval };
