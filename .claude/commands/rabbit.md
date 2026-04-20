# Rabbit

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
   - **Fix it** — make the code change, commit it, reply inside the thread explaining what was done, then resolve it. Never resolve before the commit exists.
   - **Dismiss** — reply inside the thread explaining clearly why the suggestion was intentionally ignored, then resolve it. A reply is mandatory before resolving.
   - **Skip** — leave it for later, no action

6. After the user confirms an action (Fix or Dismiss), use GraphQL with `GITHUB_CLASSIC_TOKEN` from `.env` (the fine-grained token cannot resolve threads):
   ```bash
   GITHUB_CLASSIC_TOKEN=$(grep '^GITHUB_CLASSIC_TOKEN=' .env | cut -d '=' -f2)
   ```

   **a. Get the thread node_id from the comment's node_id** (available in `mcp__github__get_pull_request_comments` response as `node_id`):
   ```bash
   curl -s -X POST https://api.github.com/graphql \
     -H "Authorization: bearer $GITHUB_CLASSIC_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"query{node(id:\"COMMENT_NODE_ID\"){...on PullRequestReviewComment{pullRequestReviewThread{id isResolved}}}}"}'
   ```

   **b. Reply inside the thread:**
   ```bash
   curl -s -X POST https://api.github.com/graphql \
     -H "Authorization: bearer $GITHUB_CLASSIC_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation{addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:\"THREAD_NODE_ID\",body:\"@coderabbitai REPLY_TEXT\"}){comment{body}}}"}'
   ```

   **c. Resolve the thread:**
   ```bash
   curl -s -X POST https://api.github.com/graphql \
     -H "Authorization: bearer $GITHUB_CLASSIC_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation{resolveReviewThread(input:{threadId:\"THREAD_NODE_ID\"}){thread{isResolved}}}"}'
   ```

7. Only act on what the user explicitly approves — never auto-resolve all comments.

## Rules

- Never resolve or reply to a comment without user confirmation
- Be honest about tradeoffs — if a suggestion would add complexity for little gain, say so
- CodeRabbit reviews are high signal — treat them seriously, not as noise to dismiss
- After acting on a comment, commit the fix before moving to the next one
- Always reply to comments in English
- Always mention `@coderabbitai` at the start of thread replies
