import { createWorker } from 'tesseract.js';

export default {
  name: '.ocr',
  description: 'Extracts text from an image using OCR',
  
  async execute(message, args, client) {
    if (!message.hasQuotedMsg) {
      return await message.reply('❌ Please reply to some image containing text.');
    }

    const quotedMsg = await message.getQuotedMessage();

    if (!quotedMsg.hasMedia) {
      return await message.reply('❌ Please reply to an image containing text.');
    }

    const lang = args[0] || 'eng'; // default to English if no language is given
    const media = await quotedMsg.downloadMedia();

    if (!media || media.mimetype.split('/')[0] !== 'image') {
      return await message.reply('❌ The replied message is not a valid image.');
    }

    reply = await message.reply(`🔍 Processing image using language \`${lang}\`...`);

    try {
      const worker = await createWorker(lang);
      const buffer = Buffer.from(media.data, 'base64');

      const {
        data: { text },
      } = await worker.recognize(buffer);

      await worker.terminate();

      const cleanText = text.trim() || '❌ No readable text found in the image.';

      await reply.edit(`📃 OCR Result:\n\n${cleanText}`);
    } catch (err) {
      console.error('OCR error:', err);
      await reply.edit('❌ Error while performing OCR. Make sure the language code is valid.');
    }
  },
};
