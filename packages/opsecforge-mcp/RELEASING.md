# Releasing opsecforge-mcp

Releases are published by GitHub Actions when a `mcp-vX.Y.Z` tag is pushed. There is no npm token and no two-factor code involved: npm and the official MCP Registry both accept the short-lived OIDC token of the workflow run.

Workflow: [`.github/workflows/release-mcp.yml`](../../.github/workflows/release-mcp.yml)

## One-time setup (already done? skip to "Releasing")

### 1. Register the GitHub workflow as a Trusted Publisher on npmjs.com

Needs the npm account that owns the package (`cyberdroid2077`), and the package must already exist on npm (it does: 0.1.0).

1. Sign in at <https://www.npmjs.com> and open the package page: <https://www.npmjs.com/package/opsecforge-mcp>.
2. Click **Settings** (the package's own settings tab, not your account settings). Path: npmjs.com -> Packages -> `opsecforge-mcp` -> Settings -> Trusted publishing.
3. Find the **Trusted Publisher** section and choose **GitHub Actions** as the provider.
4. Fill in the fields exactly like this:

   | Field | Value |
   | --- | --- |
   | Organization or user | `cyberdroid2077` |
   | Repository | `opsecforge-tools` |
   | Workflow filename | `release-mcp.yml` (file name only, with the extension, no `.github/workflows/` prefix) |
   | Environment name | leave **empty** (the workflow does not use a GitHub environment) |
   | Allowed actions | tick **`npm publish`** (`npm stage publish` is always allowed, `npm publish` must be allowed separately, and this workflow calls plain `npm publish`). Leave `npm dist-tag` off |

5. Save. npm does not validate the values when you save; a typo only shows up as an `ENEEDAUTH` / 404 error on the first publish. Case and extension of the workflow file name must match exactly.

If the "Allowed actions" row is not shown in your npm UI, ignore it; older UI versions have only the first four fields.

Optional hardening afterwards: package **Settings -> Publishing access -> "Require two-factor authentication and disallow tokens"**. Per the npm docs, trusted publishers keep working under that setting (it only affects token authentication), and it blocks any leaked classic or granular token from publishing.

### 2. Check what the Trusted Publisher relies on

- `package.json` has `"repository": { "url": "git+https://github.com/cyberdroid2077/opsecforge-tools.git" }`. npm requires it to match the GitHub repository exactly.
- The repository is public and the package is public, so npm attaches provenance automatically.
- The workflow runs on GitHub-hosted runners (`ubuntu-latest`). Self-hosted runners are not supported by npm Trusted Publishing.

### 3. MCP Registry: nothing to configure

`mcp-publisher login github-oidc` needs no secret. The registry reads the `repository_owner` claim of the OIDC token (`cyberdroid2077`) and grants publishing under `io.github.cyberdroid2077/*`. That is why `server.json` / `mcpName` use `io.github.cyberdroid2077/opsecforge`. The registry also verifies that the npm package's `mcpName` equals the server name.

## Releasing

1. **Start from an up-to-date `main`.** The workflow refuses tags whose commit is not on `main`.
2. **Change the version in three places, to the same value** (example: `0.1.1`):
   - `packages/opsecforge-mcp/package.json` -> `"version"`
   - `packages/opsecforge-mcp/server.json` -> top-level `"version"`
   - `packages/opsecforge-mcp/server.json` -> `packages[0].version`

   Use `cd packages/opsecforge-mcp && npm version 0.1.1 --no-git-tag-version` for the first, edit `server.json` by hand for the other two. Update the plugin's `npx -y opsecforge-mcp@0.1` pin only if you move to a new minor line.
3. **Run the checks locally:** `cd packages/opsecforge-mcp && npm ci && npm run typecheck && npm test`.
4. **Commit and merge to `main`** (pull request or direct, as usual for this repo). Remember that pushing `main` triggers the Vercel production deployment of the website; the package directory is independent of it.
5. **Tag the merge commit and push the tag:**

   ```bash
   git switch main && git pull --ff-only
   git tag mcp-v0.1.1
   git push origin mcp-v0.1.1
   ```

   The tag must be exactly `mcp-v` + the version, plain `MAJOR.MINOR.PATCH` (pre-release suffixes are rejected on purpose, because they would be published under the `latest` dist-tag).
6. **Watch the run** in the Actions tab ("Release MCP"). Three jobs run in order:
   1. `verify`: tag = package.json = server.json versions, `mcp-publisher validate`, typecheck, tests, package contents (only `dist/index.cjs`, `README.md`, `LICENSE`, `package.json`), builds the tarball.
   2. `npm-publish`: publishes that exact tarball with provenance via Trusted Publishing.
   3. `mcp-registry`: waits for the version to show up on npm, logs in with GitHub OIDC, publishes `server.json`.
7. **Check the result:**
   - <https://www.npmjs.com/package/opsecforge-mcp> shows the new version with a "Provenance" badge.
   - `curl -s 'https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.cyberdroid2077/opsecforge'` lists the new version.

### If a run fails

- A failure before `npm-publish` publishes nothing. Fix the problem on `main`, then **move the tag** (`git tag -d mcp-vX.Y.Z && git push origin :refs/tags/mcp-vX.Y.Z`, re-tag the new commit, push) or bump to the next patch version. Prefer the new patch version if there is any doubt.
- If `npm-publish` succeeded but `mcp-registry` failed, use **Re-run failed jobs** in the Actions UI. Only the registry job runs again; npm is not touched. Do not re-run the whole workflow: npm refuses to publish the same version twice and the run would fail at that step.
- `ENEEDAUTH` / "404 Not Found" on `npm publish`: the Trusted Publisher entry on npmjs.com does not match (owner, repository, workflow file name, or environment).
- Registry "invalid audience": `MCP_PUBLISHER_VERSION` in the workflow is too old for the registry; bump it (see below).
- Registry "You do not have permission to publish this server": the server name does not start with `io.github.<repository owner>/`.

## Rollback and retraction

- **A published npm version is permanent.** The same `name@version` can never be published again, even after unpublishing. A fix always ships as a new version.
- **Prefer `npm deprecate` over `npm unpublish`:**
  `npm deprecate opsecforge-mcp@0.1.1 "Broken release, use 0.1.2"` (needs a logged-in owner; this one is a manual command with the usual npm 2FA). npm only allows unpublishing within 72 hours of publishing when no other public package depends on it; after that, only with no dependents, fewer than 300 downloads in the last week and a single owner. Unpublishing also breaks everyone pinned to that version. Policy: <https://docs.npmjs.com/policies/unpublish>.
- **If the bad version is `latest`:** publish a fixed patch version, or point the tag back with `npm dist-tag add opsecforge-mcp@<good-version> latest`.
- **A leaked or malicious release** (compromised workflow, wrong content): deprecate it on npm, publish a clean patch, and mark it in the Registry:

  ```bash
  mcp-publisher login github      # interactive device login as cyberdroid2077
  mcp-publisher status --status deleted --message "Reason" io.github.cyberdroid2077/opsecforge 0.1.1
  ```

  Use `--status deprecated` for "works but do not use". `--status active` restores a version. This is a visibility change in the Registry, not removal of the npm package.
- **Deleting a git tag does not unpublish anything.** Removing `mcp-vX.Y.Z` from GitHub only matters if you want to re-run the workflow for that tag; npm and the Registry keep what was published.
- **Re-running the whole workflow for an old tag** will fail at `npm publish` (version already exists). That is the intended safety net.

## Maintenance notes

- All third-party actions are pinned to full commit SHAs with the version in a comment. To update one, resolve the new tag to its commit SHA and change both.
- `mcp-publisher` is pinned in the workflow (`MCP_PUBLISHER_VERSION` and `MCP_PUBLISHER_SHA256`, Linux amd64 asset). To bump it, download the new release asset, compute `sha256sum` and update both values. Releases older than the registry deployment can fail with "invalid audience".
- `NPM_PINNED_VERSION` is the npm installed when the runner's Node 22 ships an npm older than 11.5.1 (the Trusted Publishing minimum).
- The workflow file name is part of the npm Trusted Publisher registration. If you rename `release-mcp.yml`, update the entry on npmjs.com first.
- Optional hardening: create a GitHub environment (for example `npm-release`) with a required reviewer, add `environment: npm-release` to the `npm-publish` job, and type the same name into npm's "Environment name" field. Every release then pauses for a human approval click. Both sides must match, otherwise publishing fails.
- Anyone with write access to the repository can push a `mcp-v*` tag that points at a commit on `main`. Protect the tag pattern with a GitHub tag ruleset if you want to limit who can release.
