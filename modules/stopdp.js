import { autodpInterval } from './.autodp.js';

export default {
  name: '.stopdp',
  description: 'Stop the automatic profile picture update',

  async execute(msg) {
    if (!autodpInterval) {
      await msg.reply('ℹ️ AutoDP is not running.');
      return;
    }

    clearInterval(autodpInterval);
    globalThis.autodpInterval = null; // OR manually reset it here with a setter
    await msg.reply('🛑 AutoDP stopped.');
  }
};
