import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { markdownTable } from 'markdown-table'
import comment from './comment'

const WORKSPACE: string = process.env.GITHUB_WORKSPACE!


function parseFile(filePath: string) {
  const content = fs.readFileSync(path.resolve(WORKSPACE, filePath))

  return JSON.parse(content.toString())
}

function summaryTable(baseCoveredPercent: number, headCoveredPercent: number, threshold: number): string {
  return markdownTable([
    ['Base Coverage', 'Head Coverage', 'Threshold'],
    [`${baseCoveredPercent}%`, `${headCoveredPercent}%`, `${threshold}%`]
  ])
}

async function run(): Promise<void> {
  try {
    const threshold: number = Number.parseInt(core.getInput('threshold'), 10)
    const pullRequestId = github.context.issue.number

    if (!pullRequestId) {
      core.warning('Cannot find the PR id')
      return
    }

    const lastRunPercentage = {
      base: parseFile('base-coverage-reports/.last_run.json').result.line,
      head: parseFile('head-coverage-reports/.last_run.json').result.line
    }

    const resultSets = {
      base: parseFile('base-coverage-reports/.resultset.json'),
      head: parseFile('head-coverage-reports/.resultset.json')
    }

    await comment(pullRequestId, summaryTable(lastRunPercentage.base, lastRunPercentage.head, threshold))

    if (lastRunPercentage.base < threshold)
      throw new Error(`Coverage is less than ${threshold}%. (${lastRunPercentage.base}%)`)
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
