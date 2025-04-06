module.exports = (client) => {
    client.on('message', async (message) => {
        // Check if message is 'ping' and sent by you
        if (message.body.toLowerCase() === 'ping' && message.fromMe) {
            try {
                await message.edit('pong');
                console.log('✅ Message edited to pong');
            } catch (err) {
                console.error('❌ Failed to edit message:', err.message);
            }
        }
    });
};
