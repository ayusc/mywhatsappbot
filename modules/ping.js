export default {
  name: '.ping',
  description: 'Replies with Pong',

  async execute(msg, args, client) {
    const chat = await msg.getChat();
    await chat.sendMessage('🏓 Pong!');
  }
};
