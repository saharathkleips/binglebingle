#!/bin/bash

if [ -z "$GITHUB_TOKEN" ]; then
    export GITHUB_TOKEN=$(gh auth token 2>/dev/null)
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated."
  echo "Please run 'gh auth login' in your terminal and try again."
  exit 1
fi

REPO_FULL=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
OWNER=$(echo $REPO_FULL | cut -d'/' -f1)
REPO=$(echo $REPO_FULL | cut -d'/' -f2)
PR_NUM=$(gh pr view --json number -q '.number')

if [ -z "$PR_NUM" ]; then
  echo "Error: No PR found for this branch."
  exit 1
fi

gh api graphql -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(last: 100) {
        nodes {
          isResolved
          isOutdated
          path
          line
          comments(last: 20) {
            nodes {
              body
              diffHunk
            }
          }
        }
      }
    }
  }
}' -f owner="$OWNER" -f repo="$REPO" -F pr=$PR_NUM \
| jq -r '.data.repository.pullRequest.reviewThreads.nodes
    | map(select(.isResolved == false and .isOutdated == false))
    | group_by(.path)
    | map(
        "## File: " + .[0].path + "\n" +
        (map(
          "### Line " + (.line | tostring) + "\n\n" +
          (.comments.nodes | map(.body) | join("\n\n---\n\n"))
        ) | join("\n\n"))
      )
    | join("\n\n---\n\n")'
