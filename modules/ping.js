export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(msg, args, client) {
    const start = Date.now(); // Start timestamp
    
    const end = Date.now(); // End timestamp
    const timeTaken = end - start; // Milliseconds

    //console.log(`Pong ! (${timeTaken} ms)`);
    await msg.reply(`Pong !\nResponse time: ${timeTaken} ms`);
    await msg.delete(true, true);
  }
};
