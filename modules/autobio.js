
import fetch from 'node-fetch';

let interval = null;

export const autobioInterval = () => interval; // Optional export for other files to access

export default {
  name: '.autobio',
  description: 'Start updating WhatsApp "About" with motivational quotes every X seconds (default 10s)',

  async execute(msg, args, client) {
    const AUTO_BIO_INTERVAL = process.env.AUTO_BIO_INTERVAL_MS || 60000

    if (interval) {
      await msg.reply('⚠️ AutoBio is already running!');
      return;
    }

    await msg.reply(`✅ AutoBio started! Updating about every ${AUTO_BIO_INTERVAL / 1000} seconds.`);

    interval = setInterval(async () => {
      try {
        const res = await fetch('https://quotes-api-self.vercel.app/quote');
        const data = await res.json();

        const quote = `${data.quote} —${data.author}`;
        if (quote.length <= 139) {
          await client.setStatus(quote);
          console.log(`✅ Set about successful`);
        } else {
          console.log(`⏭️ Skipped long quote (${quote.length} chars)`);
        }
      } catch (err) {
        console.error('❌ Error fetching quote or setting status:', err.message);
      }
    }, AUTO_BIO_INTERVAL);
  }
};

export { interval };
