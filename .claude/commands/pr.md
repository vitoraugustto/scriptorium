# PR

Analyze the current branch and open a pull request on GitHub, fully filled out.

## Steps

1. Get the current branch name:
   ```bash
   git branch --show-current
   ```
   If the branch is `main`, stop immediately and tell the user to switch to a feature branch before running `/pr`.

2. Get all commits since this branch diverged from main:
   ```bash
   BASE=$(git merge-base HEAD origin/main || git merge-base HEAD main)
   git log "$BASE"..HEAD --oneline
   ```

3. Get the full diff:
   ```bash
   BASE=$(git merge-base HEAD origin/main || git merge-base HEAD main)
   git diff "$BASE"..HEAD
   ```

4. Based on the commits and diff, determine:
   - **Title**: short imperative sentence (under 60 chars) describing the change
   - **Type**: Feature / Fix / Refactor / Chore / Docs
   - **What changed**: one paragraph explaining what the PR does and why
   - **Changes**: bullet list of meaningful changes (one per logical unit, not per file)
   - **Notes for reviewer**: any tradeoffs, non-obvious decisions, or things that need special attention

5. Write the body to a temp file and open the PR with `gh`:
   ```bash
   gh pr create --base main --head "$(git branch --show-current)" \
     --title "<title>" --body-file /tmp/pr-body.md --assignee vitoraugustto
   ```
   Write the body with a heredoc rather than inline, so backticks and quotes survive.

6. Confirm it was created and assigned, then clean up the temp file:
   ```bash
   gh pr view <number> --json number,title,state,assignees
   ```

## Rules

- Never ask the user to fill anything — generate everything from the diff and commits
- Be concise in the body — reviewers read fast
- Do not include internal refactors or test-only changes as features
- After creating the PR, print the PR URL
- Use the `gh` CLI, not the GitHub MCP tools — no MCP server is connected to this project
- `/pr` proposes changes. To release, run the **Release** action on GitHub (Actions → Release → Run workflow) with the PR number and the bump — it merges the PR and publishes the release. `/ship` is the manual fallback.

### Body format rules
- **Type**: always render all 5 checkboxes (`Feature`, `Fix`, `Refactor`, `Chore`, `Docs`), mark only the applicable one with `[x]`
- **Ready when**: always render both checkboxes (`Unit tests pass`, `E2E tests pass locally`), leave unchecked — CI will auto-check them
- **Notes for reviewer**: only include if there is a genuine tradeoff or non-obvious decision; omit entirely if there is nothing meaningful to say
