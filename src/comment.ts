import * as core from '@actions/core'
import * as github from '@actions/github'

export async function comment(pullRequestId: number, message: string): Promise<void> {
  const octokit = github.getOctokit(core.getInput('token'))

  await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId,
    body: `## Ruby Simplecov Repor\n${message}`
  })
}
