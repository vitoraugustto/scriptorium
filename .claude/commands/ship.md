# Ship

Close the current release: bump version, update CHANGELOG.md, commit, tag, and create a GitHub Release.

**Prefer the Release action.** On GitHub, Actions → Release → Run workflow takes a PR number and a bump, verifies the PR's checks are green, merges it, and does everything below automatically. Use `/ship` only when releasing something that did not come from a single PR, or when the action is unavailable.

## Steps

1. Read the current version from `package.json`

2. Get commits since the last version tag (or all commits if no tag exists):
   ```bash
   LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
   if [ -n "$LAST_TAG" ]; then
     git log "$LAST_TAG"..HEAD --oneline
   else
     git log --oneline
   fi
   ```

3. Group commits by type:
   - **Added** — new features, new upgrades, new screens
   - **Changed** — changes to existing behavior
   - **Fixed** — bug fixes
   - **Removed** — removed features or code
   - **Internal** — tests, refactors, CI, tooling (omit from CHANGELOG)

4. Based on the changes, determine the version bump:
   - `patch` — only fixes and internal changes
   - `minor` — at least one new feature (Added or Changed)
   - `major` — breaking change to game mechanics or save format

5. Ask the user to confirm the version bump before proceeding.

6. After confirmation:
   - Update `version` in `package.json` (edit the `"version"` field directly)
   - Prepend to `CHANGELOG.md` using [Keep a Changelog](https://keepachangelog.com) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...
```

   - Commit both files: `chore: release vX.Y.Z`
   - Create a git tag: `git tag vX.Y.Z`

7. Remind the user to run `git push origin main --tags`, then wait for confirmation that the push is done.

8. After push confirmation, create the GitHub Release with `gh`:
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file /tmp/release-notes.md
   ```
   Write the notes to a file first (the CHANGELOG entry for this version). Print the release URL when done.

## Rules

- Run this on `main` after merging a PR, not on a feature branch
- Only include user-facing changes in CHANGELOG — omit tests, CI, refactors
- Do not push — remind the user to run `git push origin main --tags` and wait for confirmation before creating the GitHub Release
- The GitHub Release body should mirror the CHANGELOG entry for this version
- Use the `gh` CLI for GitHub operations. `GITHUB_CLASSIC_TOKEN` in `.env` is stale and returns "Bad credentials"
