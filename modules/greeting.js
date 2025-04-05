// modules/greeting.js
module.exports = {
  trigger: "hi",
  handler: async (msg) => {
    await msg.reply(`Hello! I am ${process.env.BOT_NAME} 👋`);
  }
};
