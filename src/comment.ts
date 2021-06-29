import * as core from '@actions/core'
import * as github from '@actions/github'

const HEADER: string = '## Ruby Simplecov Report'

async function findComment(octokit: any, pullRequestId: number) {
  const { data: commentList } = await octokit.rest.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId
  })

  return commentList.find((comment: any) => comment.body.startsWith(HEADER))
}

export default async function comment(
  pullRequestId: number,
  summaryMessage: string,
  differenceMessage: string
): Promise<void> {
  const octokit = github.getOctokit(core.getInput('token'))
  const comment = await findComment(octokit, pullRequestId)
  const body = `${HEADER}\n${summaryMessage}\n## Coverage difference\n${differenceMessage}`

  if (comment) {
    if (comment.body === body)
      return

    await octokit.rest.issues.deleteComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      comment_id: comment.id
    })
  }

  await octokit.rest.issues.createComment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId,
    body: body
  })
}
