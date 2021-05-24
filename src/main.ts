import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'

const WORKSPACE: string = process.env.GITHUB_WORKSPACE!

interface LastRun {
  result: {
    line?: number
  }
}

function parseLastRun(filePath: string): LastRun {
  const content = fs.readFileSync(path.resolve(WORKSPACE, filePath))
  return JSON.parse(content.toString()) as LastRun
}

async function run(): Promise<void> {
  try {
    const pullRequestId = github.context.issue.number
    if (!pullRequestId) {
      throw new Error('Cannot find the PR id')
    }

    const coveredPercent = parseLastRun('head-coverage-reports/.last_run.json')

    const octokit = github.getOctokit(core.getInput('token'))

    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pullRequestId,
      body: `Test coverage percent: ${coveredPercent}`
    })
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
