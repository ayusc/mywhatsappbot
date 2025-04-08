import { autodpInterval } from './.autodp.js';

export default {
  name: '.stopdp',
  description: 'Stop the automatic profile picture update',

  async execute(msg, args, client) {
    if (!autodpInterval) {
      await msg.reply('ℹ️ AutoDP is not running.');
      return;
    }

    clearInterval(autodpInterval);
    globalThis.autodpInterval = null; // Reset for reuse
    await msg.reply('🛑 AutoDP stopped.');
  }
};
