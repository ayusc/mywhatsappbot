export default {
  name: '.ping',
  description: 'Check ping response',

  async execute(msg, args, client) {
    try {
      const chat = await msg.getChat();
      const messages = await chat.fetchMessages({ limit: 1 }); // get last message

      const lastMsg = messages[0];

      // Optionally try deleting your last message from your view
      if (lastMsg.fromMe) {
        await lastMsg.delete(); // Deletes from *your view*, not everyone's
      }

      // Simulate the "edit" by sending the new message
      await chat.sendMessage('🏓 Pong!');
    } catch (err) {
      console.error('❌ Simulated edit failed:', err.message);
    }
  }
};
