export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(message, arguments_, client) {
    const start = Date.now();

    const sentMessage = await message.reply('*Pong !*');

    const end = Date.now();

    const timeTaken = ((end - start) / 1000).toFixed(3);

    // Wait for msg to register
    await new Promise(r => setTimeout(r, 3000));

    await sentMessage.edit(`*Pong !*\nResponse time: ${timeTaken}s`);
  },
};
