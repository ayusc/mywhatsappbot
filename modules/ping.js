export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(msg, args, client) {
    const start = Date.now();

    const end = Date.now();
    
    const timeTaken = end - start;
    
    await msg.reply('Pong !');
  }
};
