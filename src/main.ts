import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { markdownTable } from 'markdown-table'
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

function summaryTable(): string {
  const baseCoveredPercent = parseLastRun('base-coverage-reports/.last_run.json')
  const headCoveredPercent = parseLastRun('head-coverage-reports/.last_run.json')

  return markdownTable([
    ['Base Coverage', 'Head Coverage'],
    [`${baseCoveredPercent.result.line}%`, `${headCoveredPercent.result.line}%`]
  ])
}

async function run(): Promise<void> {
  try {
    const pullRequestId = github.context.issue.number
    if (!pullRequestId) {
      core.warning('Cannot find the PR id')
      return
    }

    await comment(pullRequestId, summaryTable())
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
