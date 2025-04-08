import { autodpInterval } from './autodp.js';

export default {
  name: '.stopdp',
  description: 'Stop AutoDP',

  async execute(msg, args, client) {
    if (autodpInterval) {
      clearInterval(autodpInterval);
      global.autodpInterval = null;
      await msg.reply('🛑 AutoDP stopped.');
    } else {
      await msg.reply('ℹ️ AutoDP is not running.');
    }
  }
};
