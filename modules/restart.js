import { dispatchWorkflow, cancelWorkflowRun } from '../newaction.js';

const CURRENT_RUN_ID = process.env.GITHUB_RUN_ID;

export default {
  name: '.restart',
  description:
    'Restarts the GitHub Actions workflow by dispatching a new one and canceling the current run',

  async execute(message, arguments_, client) {
    await message.reply('♻️ Restarting the bot...');

    try {
      await dispatchWorkflow();
      await cancelWorkflowRun(CURRENT_RUN_ID);
    } catch (error) {
      console.error('❌ Error during restart:', error);
      await message.reply(
        '❌ Failed to restart workflow: ' +
          (error?.response?.data?.message || error.message)
      );
    }
  },
};
