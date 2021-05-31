import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import comment from './comment'

const WORKSPACE: string = process.env.GITHUB_WORKSPACE!

type LastRun = {
  result: {
    line: number
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
      core.warning('Cannot find the PR id')
      return
    }

    const coveredPercent = parseLastRun('head-coverage-reports/.last_run.json')

    await comment(pullRequestId, `Test coverage percent: ${coveredPercent}`)
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
