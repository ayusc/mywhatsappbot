export default {
  name: '.ping',
  description: 'Replies with Pong',

  async execute(msg, args, client) {
    console.log('🏓 Pong!');
    await msg.delete(true); 
    await msg.edit('🏓 Pong!');
  }
};
