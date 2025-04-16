export default {
  name: ".ping",
  description: "Replies with Pong and response time",

  async execute(msg, args, client) {
    const start = Date.now();

    const sentMsg = await msg.reply("*Pong !*");

    const end = Date.now();

    const timeTaken = ((end - start) / 1000).toFixed(3);

    //wait for msg to register
    await new Promise((r) => setTimeout(r, 2500));

    await sentMsg.edit(`*Pong !*\nResponse time: ${timeTaken}s`);
  },
};
