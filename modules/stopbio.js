import {interval} from './autobio.js'

export default {
  name: '.stopbio',
  description: 'Stop updating WhatsApp "About" automatically.',

  async execute(message) {
    if (interval) {
      clearInterval(interval)
      globalThis.interval = null
      await message.reply('🛑 AutoBio stopped.')
      await message.delete(true, true)
    } else {
      await message.reply('ℹ️ AutoBio is not running.')
      await message.delete(true, true)
    }
  },
}
