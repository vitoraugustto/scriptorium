# Ship

Close the current release: bump version, update CHANGELOG.md, commit, tag, and create a GitHub Release.

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
   - Update `version` in `package.json`
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

8. After push confirmation, create the GitHub Release via curl using `GITHUB_CLASSIC_TOKEN` from `.env`:
   ```bash
   source .env
   curl -s -X POST https://api.github.com/repos/vitoraugustto/scriptorium/releases \
     -H "Authorization: bearer $GITHUB_CLASSIC_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tag_name": "vX.Y.Z",
       "name": "vX.Y.Z",
       "body": "<CHANGELOG content for this version>"
     }' | jq '{html_url, message}'
   ```
   Print the release URL when done.

## Rules

- Run this on `main` after merging a PR, not on a feature branch
- Only include user-facing changes in CHANGELOG — omit tests, CI, refactors
- Do not push — remind the user to run `git push origin main --tags` and wait for confirmation before creating the GitHub Release
- The GitHub Release body should mirror the CHANGELOG entry for this version
