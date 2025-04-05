export default {
  name: 'ping',
  description: 'Replies with pong!',
  execute: async (client, message) => {
    if (message.body.toLowerCase() === '!ping') {
      await message.reply('pong!');
    }
  }
};
