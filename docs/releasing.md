# Releasing the npm MCP package

## How the workflows fit together

- `ci.yml`: every push/PR checks types, regression tests, build, formatting, and the packed package on Linux/Windows with Node 22/24.
- `release.yml`: a pushed stable `v*` tag verifies checks, package contents, tag/version equality and main ancestry; then publishes to npm with OIDC provenance.
- Regular main pushes never publish. Creating a GitHub release by itself does not trigger this workflow; pushing a version tag does.

The package includes compiled `dist/`, browser `public/`, examples and the automatically included package metadata/README. `prepack` builds TypeScript, so consumers do not need TypeScript or tsx. The bin entry points to a compiled file with a Node shebang. CI installs a tarball in a fresh directory, runs the installed executable through MCP, and checks its HTTP player/API.

## One-time maintainer setup

1. The project uses the MIT license. Confirm the release contains `LICENSE`.
2. Sign into the npm account that will own the package. The package is `@empirerider/code-anime`; sign in as `empirerider` and confirm you own that npm scope.
3. For a new package, bootstrap the first version from your authenticated workstation: `npm ci`, `npm run check`, `npm run package:check`, `npm login`, then `npm publish --access public`. Complete npm's required authentication/2FA. Do not create the automated tag for this same version afterward: npm versions cannot be republished.
4. In the npm package settings, add a GitHub Actions trusted publisher with owner `EmpRider`, repository `code-anime`, workflow filename `release.yml`, and environment `npm`. Allow direct `npm publish`. Follow npm's current setup instructions if it supports a different new-package bootstrap path.
5. In GitHub, create the `npm` environment. Configure any required reviewers or release-tag restrictions to match your team's policy. No `NPM_TOKEN` secret is used by this workflow.
6. Complete a subsequent automated release promptly after configuring the trusted publisher; npm currently expires new unused configurations after two days.

Reference: https://docs.npmjs.com/trusted-publishers/

## Subsequent releases

From a clean main checkout containing the intended changes:

```sh
npm ci
npm run check
npm run package:check
npm version patch --no-git-tag-version
npm run format
# Commit package.json and package-lock.json, then push main.
git tag v0.1.1
git push origin v0.1.1
```

Use the actual new package version as the tag; `v0.1.1` is only an example. The workflow refuses mismatched tags and prerelease versions. Do not move an existing published release tag. If a workflow fails before publishing, investigate and rerun the unchanged tag when appropriate. If npm already accepted the version, release fixes under a new version.

After publication, verify `npm view @empirerider/code-anime version` and configure an MCP host with `npx -y @empirerider/code-anime@<version>`. The CLI stays running on stdio; it is not a help command. Test through an MCP client rather than waiting for ordinary command-line output.

## Boundaries

The workflow is prepared, but npm account ownership, first publication, trusted-publisher settings are not configured by committing YAML. GitHub CI/release results must be inspected after they run. Supporting stdio MCP does not guarantee compatibility with every AI host or automatically make localhost accessible from remote hosts.
