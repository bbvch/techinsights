# Tech Insights by bbv

A simple, engineer-driven technical blog (Docusaurus) for sharing posts, tutorials, sample code, and videos.

## Requirements

Install Node.js version 22 or above (24 is used in CI; check your version with `node -v`). You can use nvm to manage multiple Node.js versions on a single machine.
When installing Node.js, it is recommended to check all checkboxes related to dependencies.
See for more details [docusaurus requirements](https://docusaurus.io/docs/installation#requirements)

### Set up pnpm

Run these commands in the terminal you use for this project:

```powershell
node --version
npm install --global corepack@latest
corepack enable pnpm
pnpm --version
```

Corepack uses the pnpm version pinned in `package.json`. Updating Corepack also avoids signature errors such as `Cannot find matching keyid` in older bundled versions.

On Windows with nvm-windows, install and activate a supported Node.js version first, for example:

```powershell
nvm install 24.19.0
nvm use 24.19.0
```

Switching Node.js versions can require an elevated terminal. Repeat the pnpm setup after switching versions, since global tools belong to the active Node.js installation.

If PowerShell reports that `pnpm` is not recognized, run `corepack enable pnpm` and reopen the terminal if needed. If enabling the command fails because the Node.js directory is not writable, use `corepack pnpm` directly instead:

```powershell
corepack pnpm install
corepack pnpm start
```

## Quick start

- Install dependencies: `pnpm install`
- Run locally: `pnpm start`
- Build: `pnpm run build`
- Test: `pnpm test`
- Check TypeScript: `pnpm run typecheck`

## Search

- Index pages locally: `pnpm run build`
- Then start the app: `pnpm run serve`

## Contributing

Please read the contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)

## Project structure

- `blog/` — blog posts and assets (each post in a dated folder)
- `src/` — React components and theme overrides
- `plugins/` — local Docusaurus plugins (e.g. the blog plugin extended with related articles)
- `static/` — public assets

If you need help, open an issue or tag a maintainer in your PR.
