export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(msg, args, client) {
    const start = Date.now();

    await msg.getChat(); // optional
    await msg.reply('🏓 Pong!'); // main async operation
    const end = Date.now();

    const timeTaken = end - start;

    await chat.sendMessage(`🏓 Pong!\nResponse time: ${timeTaken} ms`);
    await msg.delete(true, true);
  }
};
