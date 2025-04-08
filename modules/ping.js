export default {
  name: '.ping',
  description: 'Replies with Pong',

  async execute(msg, args, client) {
    console.log('🏓 Pong!');
    const chat = await msg.getChat();
    await msg.delete(true, true); 
    await chat.sendMessage('🏓 Pong!');
  }
};
