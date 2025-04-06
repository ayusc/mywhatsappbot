module.exports = {
    name: 'ping',
    execute: async (client, message) => {
        await message.reply('🏓 Pong!');
    }
};
