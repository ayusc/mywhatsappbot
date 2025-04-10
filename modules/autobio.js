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

    await msg.reply(`✅ AutoDP started.\nUpdating every ${AUTO_BIO_INTERVAL / 1000}s`);

    // Calculate delay until the next aligned interval
    const now = Date.now();
    const nextAligned = Math.ceil(now / AUTO_BIO_INTERVAL) * AUTO_BIO_INTERVAL;
    const delay = nextAligned - now;

    setTimeout(() => {
      // First execution after alignment
      runQuoteUpdate();

      // Start repeating interval
      interval = setInterval(runQuoteUpdate, AUTO_BIO_INTERVAL);
    }, delay);

    async function runQuoteUpdate() {
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
    }
  }
};

export { interval };
