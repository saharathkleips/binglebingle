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
      reviews(last: 100) {
        nodes {
          comments(last: 20) {
            nodes {
                    body
                    path
                    line
                    diffHunk
                    minimizedReason
                }
            }
        }
      }
    }
  }
}' -f owner="$OWNER" -f repo="$REPO" -F pr=$PR_NUM \
| jq '.data.repository.pullRequest.reviews.nodes[].comments.nodes[] | select(.minimizedReason == null) | {path, line, diffHunk, body}'
