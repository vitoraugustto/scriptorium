# Ship

Close the current release: bump version, update CHANGELOG.md, commit, and tag.

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

## Rules

- Run this on `main` after merging a PR, not on a feature branch
- Only include user-facing changes in CHANGELOG — omit tests, CI, refactors
- Do not push — remind the user to run `git push origin main --tags`
