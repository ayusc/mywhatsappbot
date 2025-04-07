export default {
  name: '.ping',
  description: 'Replies with Pong by editing the message',

  async execute(msg, args, client) {
    try {
      // Try to edit the message
      await msg.edit('🏓 Pong!');
    } catch (err) {
      // Fallback: send new message if edit fails
      console.warn('⚠️ Edit failed, sending message instead.');
      const chat = await msg.getChat();
      await chat.sendMessage('🏓 Pong!');
    }
  }
};
