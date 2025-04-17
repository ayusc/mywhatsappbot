import fs from 'node:fs'
import path from 'node:path'
import {exec} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import mime from 'mime-types'
import pkg from 'whatsapp-web.js'

const {MessageMedia} = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = path.join(__dirname, 'term_output.txt')

export default {
  name: '.term',
  description: 'Executes terminal commands with root shell access',

  async execute(message, arguments_, client) {
    let command = ''

    // Extract command from body (inline or multiline)
    const body = message.body.trim()
    if (body.startsWith('.term\n')) {
      command = body.split('\n').slice(1).join('\n').trim()
    } else if (body.startsWith('.term')) {
      command = body.replace(/^\.term\s*/, '').trim()
    }

    // If still no command, try quoted message
    if (!command && message.hasQuotedMsg) {
      const quoted = await message.getQuotedMessage()
      command = quoted.body.trim()
    }

    if (!command) return message.reply('❌ No terminal command provided.')

    exec(command, {shell: '/bin/bash'}, async (error, stdout, stderr) => {
      let output = ''

      if (stdout) output += `📤 stdout:\n${stdout}`
      if (stderr) output += `\n⚠️ stderr:\n${stderr}`
      if (error) output += `\n❌ Error:\n${error.message}`
      if (!output.trim())
        output = '✅ Command executed successfully (no output)'

      if (output.length > 2000) {
        fs.writeFileSync(OUTPUT_FILE, output)
        const media = new MessageMedia(
          mime.lookup(OUTPUT_FILE) || 'text/plain',
          fs.readFileSync(OUTPUT_FILE).toString('base64'),
          'output.txt'
        )
        const chat = await message.getChat()

        await client.sendMessage(chat.id._serialized, media, {
          caption: '✅ Output too long. Sent as file.',
        })
        fs.unlinkSync(OUTPUT_FILE)
      } else {
        await message.reply('```' + output.trim() + '```')
      }
    })
  },
}
