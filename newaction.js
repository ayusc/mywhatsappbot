import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITTOKEN;
const [REPO_OWNER, REPO_NAME] = process.env.GITHUB_REPOSITORY.split('/');
const CURRENT_RUN_ID = process.env.GITHUB_RUN_ID;
const BRANCH = 'main'; // Modify if needed

export async function cancelWorkflowRun(runId) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/cancel`;

  try {
    await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    console.log(`✅ Cancelled workflow run ${runId}`);
  } catch (error) {
    console.error(
      '❌ Failed to cancel workflow:',
      error.response?.data || error.message
    );
  }
}

export async function dispatchWorkflow() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/bot.yml/dispatches`;

  try {
    await axios.post(
      url,
      {
        ref: BRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    console.log(`🚀 Dispatched a new workflow run on the ${BRANCH} branch.`);
  } catch (error) {
    console.error(
      '❌ Failed to dispatch workflow:',
      error.response?.data || error.message
    );
  }
}

export async function startCountdown() {
  console.log('⏳ Waiting for 5 hours for next deploy ...');
  await new Promise(resolve => setTimeout(resolve, 18_000_000));
  await cancelWorkflowRun(CURRENT_RUN_ID);
  await dispatchWorkflow();
}
