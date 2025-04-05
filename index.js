import { createCanvas } from 'canvas';
import qrcode from 'qrcode';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

client.on('qr', async (qr) => {
  console.log('Generating QR Code...');

  // Generate base64 PNG
  const canvas = createCanvas(300, 300);
  await qrcode.toCanvas(canvas, qr);
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

  // Upload to imgbb
  const imgbbRes = await axios.post('https://api.imgbb.com/1/upload', null, {
    params: {
      key: process.env.IMGBB_API_KEY,
      image: base64,
      name: `whatsapp-qr-${Date.now()}`
    }
  });

  console.log('📸 Scan the QR from this link:');
  console.log(imgbbRes.data.data.url);
});
