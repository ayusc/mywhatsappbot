import { autodpInterval } from './autodp.js';

export default {
  name: '.stopdp',
  description: 'Stops the AutoDP interval',

  async execute(msg) {
    if (autodpInterval) {
      clearInterval(autodpInterval);
      global.autodpInterval = null;
      await msg.reply('🛑 AutoDP stopped.');
    } else {
      await msg.reply('ℹ️ AutoDP is not running.');
    }
  }
};
