export default {
  name: '.ping',
  description: 'Replies with Pong',

  async execute(msg, args, client) {
    console.log('🏓 Pong!');
    //const chat = await msg.getChat();
    //await chat.sendMessage('🏓 Pong!');
    await msg.edit('🏓 Pong!');
  }
};
