//  whatsappbot - A simple whatsapp userbot written in pure js
//  Copyright (C) 2025-present Ayus Chatterjee
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.

//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.


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
