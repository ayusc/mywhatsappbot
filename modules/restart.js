import { dispatchWorkflow, cancelWorkflowRun } from "../newaction.js";

const CURRENT_RUN_ID = process.env.GITHUB_RUN_ID;

export default {
  name: ".restart",
  description:
    "Restarts the GitHub Actions workflow by dispatching a new one and canceling the current run",

  async execute(msg, args, client) {
    await msg.reply("♻️ Restarting the bot...");

    try {
      await dispatchWorkflow();
      await cancelWorkflowRun(CURRENT_RUN_ID);
    } catch (err) {
      console.error("❌ Error during restart:", err);
      await msg.reply(
        "❌ Failed to restart workflow: " +
          (err?.response?.data?.message || err.message),
      );
    }
  },
};
