<!-- version-type: patch -->

# furystack

## 📚 Documentation

- Added `RELEASE.md` with documentation for the release process, prerequisites, and troubleshooting

## 📦 Build

- Updated Node.js engine requirement from `>=20.0.0` to `>=22.18.0`

## 👷 CI

- Replaced automatic `npm-release.yml` workflow with manual `release.yml` workflow
- New release workflow uses NPM Trusted Publishing (OIDC) for secure authentication
- Release workflow now runs build, lint, and tests before publishing
