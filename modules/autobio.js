import fetch from 'node-fetch';

let interval = null;

export default [
  {
    name: '.autobio',
    description: 'Start updating WhatsApp "About" with motivational quotes every X seconds (default 60s)',

    async execute(msg, args, client) {
      const AUTO_BIO_INTERVAL = parseInt(process.env.AUTO_BIO_INTERVAL_MS || '60000', 10); // default 60 seconds

      if (interval) {
        await msg.reply('⚠️ AutoBio is already running!');
        await msg.delete(true, true);
        return;
      }

      await msg.reply(`✅ AutoBio started! Updating about every ${AUTO_BIO_INTERVAL / 1000} seconds.`);
      await msg.delete(true, true);

      interval = setInterval(async () => {
        try {
          const res = await fetch('https://quotes-api-self.vercel.app/quote');
          const data = await res.json();

          const quote = `${data.quote} —${data.author}`;
          if (quote.length <= 139) {
            await client.setStatus(quote);
            console.log(`✅ Set about successfull`);
          } else {
            console.log(`⏭️ Skipped long quote (${quote.length} chars)`);
          }
        } catch (err) {
          console.error('❌ Error fetching quote or setting status:', err.message);
        }
      }, AUTO_BIO_INTERVAL);
    }
  },
  {
    name: '.stopbio',
    description: 'Stop updating WhatsApp "About" automatically.',

    async execute(msg) {
      if (interval) {
        clearInterval(interval);
        interval = null;
        await msg.reply('🛑 AutoBio stopped.');
        await msg.delete(true, true);
      } else {
        await msg.reply('ℹ️ AutoBio is not running.');
        await msg.delete(true, true);
      }
    }
  }
];
