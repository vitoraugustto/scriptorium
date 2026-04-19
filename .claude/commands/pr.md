# PR

Analyze the current branch and open a pull request on GitHub, fully filled out.

## Steps

1. Get the current branch name:
   ```
   git branch --show-current
   ```

2. Get all commits since this branch diverged from main:
   ```
   git log main..HEAD --oneline
   ```

3. Get the full diff:
   ```
   git diff main..HEAD
   ```

4. Based on the commits and diff, determine:
   - **Title**: short imperative sentence (under 60 chars) describing the change
   - **Type**: Feature / Fix / Refactor / Chore / Docs
   - **What changed**: one paragraph explaining what the PR does and why
   - **Changes**: bullet list of meaningful changes (one per logical unit, not per file)
   - **Test plan**: which tests cover this — check if unit and/or E2E tests were added or modified
   - **Notes for reviewer**: any tradeoffs, non-obvious decisions, or things that need special attention

5. Use the `mcp__github__create_pull_request` tool to open the PR with:
   - `owner`: `vitoraugustto`
   - `repo`: `scriptorium`
   - `head`: current branch name
   - `base`: `main`
   - `title`: generated title
   - `body`: filled template based on `.github/pull_request_template.md`

6. After creating the PR, use `mcp__github__update_issue` with `issue_number` = PR number and `assignees: ["vitoraugustto"]` to assign the PR.

## Rules

- Never ask the user to fill anything — generate everything from the diff and commits
- Be concise in the body — reviewers read fast
- If there are no E2E changes, uncheck the E2E test plan item and note it
- Do not include internal refactors or test-only changes as features
- After creating the PR, print the PR URL
- `/pr` is for proposing changes — run `/ship` on main after merging to close a release
