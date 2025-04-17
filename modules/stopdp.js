import {autodpInterval} from './autodp.js'

export default {
  name: '.stopdp',
  description: 'Stops the AutoDP interval',

  async execute(message) {
    if (autodpInterval) {
      clearInterval(autodpInterval)
      globalThis.autodpInterval = null
      await message.reply('🛑 AutoDP stopped.')
    } else {
      await message.reply('ℹ️ AutoDP is not running.')
    }
  },
}
