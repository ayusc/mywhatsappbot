import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// These are set automatically by GitHub Actions
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const REPO_OWNER = process.env.GITHUB_REPOSITORY.split("/")[0];
const REPO_NAME = process.env.GITHUB_REPOSITORY.split("/")[1];
const CURRENT_RUN_ID = process.env.GITHUB_RUN_ID;
const BRANCH = "main";

async function cancelWorkflowRun(runId) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/cancel`;

  try {
    await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    console.log(`✅ Cancelled workflow run ${runId}`);
  } catch (error) {
    console.error("❌ Failed to cancel workflow:", error.response?.data || error.message);
  }
}

async function dispatchWorkflow() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/main.yml/dispatches`;

  try {
    await axios.post(
      url,
      {
        ref: BRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    console.log("🚀 Dispatched a new workflow run on the main branch.");
  } catch (error) {
    console.error("❌ Failed to dispatch workflow:", error.response?.data || error.message);
  }
}

async function startCountdown() {
  console.log("⏳ Waiting for 6 hours...");
  await new Promise((resolve) => setTimeout(resolve, 6 * 60 * 60 * 1000)); // 6 hours
  await cancelWorkflowRun(CURRENT_RUN_ID);
  await dispatchWorkflow();
}

startCountdown();
