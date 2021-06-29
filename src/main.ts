import * as path from 'path'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { markdownTable } from 'markdown-table'
import comment from './comment'

const WORKSPACE: string = process.env.GITHUB_WORKSPACE!

function floorPrecised(number: number, precision: number) {
  var power = Math.pow(10, precision)

  return Math.floor(number * power) / power
}

function parseFile(filePath: string) {
  const content = fs.readFileSync(path.resolve(WORKSPACE, filePath))

  return JSON.parse(content.toString())
}

function linesCoverage(lines: any): number {
  const effectiveLines = lines.filter((hitNumber?: number) => hitNumber !== null) as number[]
  const totalLines = effectiveLines.length

  if (totalLines === 0)
    return 100

  const covered = effectiveLines.filter((hitNumber: number) => hitNumber > 0).length

  return floorPrecised((covered / totalLines) * 100, 2)
}

function filesCoverage(resultSet: any) {
  const coverages = resultSet['RSpec']['coverage']
  let files = new Map()

  for (const filename of Object.keys(coverages)) {
    const coverage = coverages[filename]

    files.set(filename, linesCoverage(coverage.lines))
  }

  return files
}

function mergeFilenames(baseCoverage: any, headCoverage: any): string[] {
  const basefiles = baseCoverage.keys()
  const headfiles = headCoverage.keys()
  const files = new Set<string>([...basefiles, ...headfiles])

  return Array.from(files).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

function formatFileDifference(filename: string, baseCoverage: any, headCoverage: any): string[] {
  let mainPercentage = ''
  let differencePercentage = ''

  if (headCoverage)
    mainPercentage = ` ${headCoverage}%`
  if (baseCoverage && headCoverage)
    differencePercentage = ` (${headCoverage - baseCoverage}%)`

  const newFile = !baseCoverage && headCoverage ? 'NEW' : ''
  const deletedFile = baseCoverage && !headCoverage ? 'DELETE' : ''

  return [filename, `${newFile}${deletedFile}${mainPercentage}${differencePercentage}`]
}

function coveragesDifference(baseCoverage: any, headCoverage: any) {
  const difference = []

  for (const filename of mergeFilenames(baseCoverage, headCoverage)) {
    const baseFile = baseCoverage.get(filename)
    const headFile = headCoverage.get(filename)

    if (baseFile !== headFile)
      difference.push(formatFileDifference(filename, baseCoverage, headCoverage))
  }

  return difference
}

function summaryTable(basePercent: number, headPercent: number, threshold: number): string {
  return markdownTable([
    ['Base Coverage', 'Head Coverage', 'Threshold'],
    [`${basePercent}%`, `${headPercent}%`, `${threshold}%`]
  ])
}

function differenceTable(baseResultSet: any, headResultSet: any): string {
  const difference = coveragesDifference(baseResultSet, headResultSet)

  if (difference.length === 0)
    return 'No differences'
  else
    return markdownTable([['Filename', 'Lines'], ...difference])
}

async function run(): Promise<void> {
  try {
    const threshold: number = Number.parseInt(core.getInput('threshold'), 10)
    const pullRequestId = github.context.issue.number

    if (!pullRequestId) {
      core.warning('Cannot find the PR id')
      return
    }

    const lastRunPercentages = {
      base: parseFile('base-coverage-reports/.last_run.json').result.line,
      head: parseFile('head-coverage-reports/.last_run.json').result.line
    }

    const resultSets = {
      base: filesCoverage(parseFile('base-coverage-reports/.resultset.json')),
      head: filesCoverage(parseFile('head-coverage-reports/.resultset.json'))
    }

    await comment(
      pullRequestId,
      summaryTable(lastRunPercentages.base, lastRunPercentages.head, threshold),
      differenceTable(resultSets.base, resultSets.head)
    )

    if (lastRunPercentages.base < threshold)
      throw new Error(`Coverage is less than ${threshold}%. (${lastRunPercentages.base}%)`)
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
