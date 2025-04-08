export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(msg, args, client) {
    const start = Date.now();
    
    const end = Date.now();

    const ping = await msg.reply('Pong !');
    
    const timeTaken = end - start;
    
    await msg.edit(`Pong !\nResponse time: ${timeTaken} ms`);
  }
};
