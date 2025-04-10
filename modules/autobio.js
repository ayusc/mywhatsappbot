import fetch from 'node-fetch';

let interval = null;

export const autobioInterval = () => interval;

export default {
  name: '.autobio',
  description: 'Start updating WhatsApp "About" with motivational quotes every X seconds (default 60s)',

  async execute(msg, args, client) {
    const AUTO_BIO_INTERVAL = process.env.AUTO_BIO_INTERVAL_MS || 60000;

    if (interval) {
      await msg.reply('⚠️ AutoBio is already running!');
      return;
    }

    const now = new Date();
    const delayUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    await msg.reply(`✅ AutoBio will start at the next full minute and update every ${AUTO_BIO_INTERVAL / 1000} seconds.`);

    setTimeout(() => {
      interval = setInterval(async () => {
        try {
          let quote = '';

          while (true) {
            const res = await fetch('https://quotes-api-self.vercel.app/quote');
            const data = await res.json();
            quote = `${data.quote} —${data.author}`;
            if (quote.length <= 139) break;
          }

          await client.setStatus(quote);
          console.log(`✅ Set about: "${quote}"`);
        } catch (err) {
          console.error('❌ Error fetching quote or setting status:', err.message);
        }
      }, AUTO_BIO_INTERVAL);
    }, delayUntilNextMinute);
  }
};
