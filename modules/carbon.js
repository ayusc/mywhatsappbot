import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import fetch from 'node-fetch'
import pkg from 'whatsapp-web.js'

const {Client, LocalAuth, MessageMedia, Poll, GroupChat} = pkg

// Required for resolving __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  name: '.carbon',
  description: 'Generate a code snippet image using Carbon',

  async execute(message, arguments_, client) {
    let code = ''

    // Case 1: command is replying to a message
    if (message.hasQuotedMsg) {
      const quoted = await message.getQuotedMessage()
      code = quoted.body.trim()
    }
    // Case 2: message has body text (including multiline)
    else {
      // Remove `.carbon` prefix from msg.body
      code = message.body.replace(/^\.carbon\s*/, '')
    }

    if (!code) {
      return message.reply('❌ Please provide some code to render.')
    }

    // Normalize indentation (optional, but keeps things clean)
    code = code
      .split('\n')
      .map(line => line.trimStart())
      .join('\n')

    // API request to Carbonara
    const response = await fetch('https://carbonara.solopov.dev/api/cook', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code,
        backgroundColor: '#FFFFFF',
        theme: '3024-night',
      }),
    })

    if (!response.ok) {
      return message.reply('⚠️ Failed to generate image from code.')
    }

    const buffer = await response.buffer()

    // Save to temporary file
    const filePath = path.join(__dirname, 'code.png')
    fs.writeFileSync(filePath, buffer)

    const carbonimg = await MessageMedia.fromFilePath(filePath)

    // Send the image as a reply
    await message.reply(carbonimg)

    // Clean up
    fs.unlinkSync(filePath)
  },
}
