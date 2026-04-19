# Review

Read open CodeRabbit comments on the current PR and help address them one by one.

## Steps

1. Get the current PR number by matching the current branch against open PRs:
   ```bash
   git branch --show-current
   ```
   Then use `mcp__github__list_pull_requests` to find the PR for this branch.

2. Fetch all review comments with `mcp__github__get_pull_request_comments`.

3. Filter to comments from `coderabbitai[bot]` only.

4. For each comment, present to the user:
   - The file and location
   - A short summary of what CodeRabbit flagged
   - Your assessment: is this already fixed in the code, valid and should be fixed, or safe to dismiss?

5. Wait for the user to decide per comment:
   - **Fix it** — make the code change, then reply to the comment with `mcp__github__add_issue_comment` explaining what was done
   - **Dismiss** — reply explaining why it was intentionally ignored
   - **Skip** — leave it for later, no action

6. Only act on what the user explicitly approves — never auto-resolve all comments.

## Rules

- Never resolve or reply to a comment without user confirmation
- Be honest about tradeoffs — if a suggestion would add complexity for little gain, say so
- CodeRabbit reviews are high signal — treat them seriously, not as noise to dismiss
- After acting on a comment, commit the fix before moving to the next one
- Always reply to comments in English
- Always mention `@coderabbitai` at the start of replies so the bot is notified
