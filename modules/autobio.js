import fetch from 'node-fetch';

export default {
  name: '.autobio',
  description: 'Auto update about status every 60 seconds with random quotes',

  async execute(msg, args, client) {
    const interval = 60000; // 60 seconds
    const maxLength = 139;

    msg.reply('✅ AutoBio started. Your About will update every 60 seconds.');

    setInterval(async () => {
      try {
        const res = await fetch('https://zenquotes.io/api/random');
        const data = await res.json();
        const quote = `${data[0].q} —${data[0].a}`;

        if (quote.length <= maxLength) {
          await client.setStatus(quote);
          console.log(`✅ About updated: ${quote}`);
        } else {
          console.log(`⚠️ Quote too long, skipped: ${quote}`);
        }
      } catch (err) {
        console.error('❌ Failed to update about:', err.message);
      }
    }, interval);
  }
};
