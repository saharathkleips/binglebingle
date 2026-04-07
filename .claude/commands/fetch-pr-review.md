---
name: fetch-pr-review
description: Fetch PR review comments for the current branch
allowed-tools:
  - Bash
  - AskUserQuestion
---
<objective>
Fetch the active PR review comments for the current branch and present them as a task list.

If the output below is empty or shows an authentication error, use `AskUserQuestion` to ask the user to run `gh auth login` or verify a PR is open for this branch.
</objective>
<context>
$(bash GITHUB_TOKEN=$(gh auth token) ./.claude/scripts/fetch_pr_reviews.sh)
</context>
