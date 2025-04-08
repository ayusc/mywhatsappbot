export default {
  name: '.ping',
  description: 'Replies with Pong and response time',

  async execute(msg, args, client) {
    const start = Date.now(); // Start timestamp
    const chat = await msg.getChat();

    await msg.delete(true, true); // Optional: delete the trigger message

    const end = Date.now(); // End timestamp
    const timeTaken = end - start; // Milliseconds

    //console.log(`Pong ! (${timeTaken} ms)`);
    await chat.sendMessage(`Pong !\nResponse time: ${timeTaken} ms`);
  }
};
