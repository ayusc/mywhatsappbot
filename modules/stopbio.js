import { interval } from "./autobio.js";

export default {
  name: ".stopbio",
  description: 'Stop updating WhatsApp "About" automatically.',

  async execute(msg) {
    if (interval) {
      clearInterval(interval);
      global.interval = null;
      await msg.reply("🛑 AutoBio stopped.");
      await msg.delete(true, true);
    } else {
      await msg.reply("ℹ️ AutoBio is not running.");
      await msg.delete(true, true);
    }
  },
};
