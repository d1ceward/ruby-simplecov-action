import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const pullRequestId = github.context.issue.number
    if (!pullRequestId) {
      throw new Error('Cannot find the PR id')
    }

    const octokit = github.getOctokit(core.getInput('token'))

    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pullRequestId,
      body: 'Test'
    })
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
