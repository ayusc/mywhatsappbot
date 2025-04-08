import { autodpInterval } from './autodp.js';

let interval = autodpInterval;

export default {
  name: '.stopdp',
  description: 'Stops the auto profile picture updater',

  async execute(msg, args, client) {
    if (interval) {
      clearInterval(interval);
      interval = null;
      await msg.reply('🛑 AutoDP stopped.');
    } else {
      await msg.reply('ℹ️ AutoDP is not running.');
    }
  }
};

export { interval as autodpInterval };
