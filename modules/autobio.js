import fetch from 'node-fetch';

let interval = null;

export default {
  name: '.autobio',
  description: 'Start/stop updating WhatsApp "About" with motivational quotes every X seconds (default 60s)',

  async execute(msg, args, client) {
    const subcommand = args[0]?.toLowerCase();
    const AUTO_BIO_INTERVAL = parseInt(process.env.AUTO_BIO_INTERVAL_MS || '60000', 10); // default 60 seconds

    if (subcommand === 'stop') {
      if (interval) {
        clearInterval(interval);
        interval = null;
        await msg.delete(true, true);
        msg.reply('🛑 AutoBio stopped.');
      } else {
        await msg.delete(true, true);
        msg.reply('ℹ️ AutoBio is not running.');
      }
      return;
    }

    if (interval) {
      await msg.delete(true, true);
      msg.reply('⚠️ AutoBio is already running!');
      return;
    }
    await msg.delete(true, true);
    msg.reply(`✅ AutoBio started! Updating about every ${AUTO_BIO_INTERVAL / 1000} seconds.`);

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
};
