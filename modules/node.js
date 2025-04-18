//  Whatsappbot - A simple whatsapp userbot written in pure js
//  Copyright (C) 2025-present Ayus Chatterjee
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.

//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'
import mime from 'mime-types'
import pkg from 'whatsapp-web.js'

const {MessageMedia} = pkg

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = path.join(__dirname, 'node_output.txt')

// Create a CommonJS-compatible require function
const require = createRequire(import.meta.url)

export default {
  name: '.node',
  description: 'Executes Node.js code with WhatsApp context (msg, client)',

  async execute(message, arguments_, client) {
    let code = ''

    // Extract code from current message
    code = message.body.trim().startsWith('.node\n')
      ? message.body.split('\n').slice(1).join('\n').trim()
      : message.body.replace(/^\.node\s*/, '').trim()

    // If no code and the message is a reply, try to extract code from the replied message
    if (!code && message.hasQuotedMsg) {
      const quoted = await message.getQuotedMessage()
      code = quoted.body.trim()
    }

    if (!code) return message.reply('❌ No code provided.')

    // Capture console output
    let logOutput = ''
    const originalLog = console.log
    console.log = (...arguments_) => {
      logOutput +=
        arguments_
          .map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2)))
          .join(' ') + '\n'
    }

    try {
      // Provide `require` and CommonJS compatibility inside user code
      const asyncFunction = new Function(
        'msg',
        'client',
        'require',
        `
          return (async () => {
            let message = msg;
            ${code}
          })();
        `
      )

      const result = await asyncFunction(message, client, require)

      console.log = originalLog // Restore console.log

      let finalOutput = ''

      if (logOutput) finalOutput += `📥 console.log:\n${logOutput}`
      if (result !== undefined)
        finalOutput += `\n✅ Result:\n${JSON.stringify(result, null, 2)}`
      finalOutput ||= '✅ Code executed successfully (no return value)'

      // Avoid sending large output directly
      if (finalOutput.length > 2000) {
        fs.writeFileSync(OUTPUT_FILE, finalOutput)
        const media = new MessageMedia(
          mime.lookup(OUTPUT_FILE) || 'text/plain',
          fs.readFileSync(OUTPUT_FILE).toString('base64'),
          'output.txt'
        )

        const chat = await message.getChat()

        await client.sendMessage(chat.id._serialized, media, {
          caption: '✅ Output too long. Sent as file.',
          quotedMessage: message,
        })
        fs.unlinkSync(OUTPUT_FILE)
      } else {
        await message.reply('```' + finalOutput.trim() + '```')
      }
    } catch (error) {
      console.log = originalLog
      await message.reply('❌ Error:\n```' + error.message + '```')
    }
  },
}
