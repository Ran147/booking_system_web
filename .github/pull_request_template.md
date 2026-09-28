## What changes

Before:

After:

## Stories

KAN- (or PROP-n for a proposed story not in Jira yet)

## Checklist

- [ ] `specs/SPEC.md` exists and this change was checked against it (`backlog-to-spec`)
- [ ] Every acceptance criterion touched has a test named with its KAN key (`unit-testing-standards`)
- [ ] No visible text in code; keys exist in `es` and `en` (`i18n-standards`)
- [ ] Checked in light and dark mode (`theming-standards`)
- [ ] New queries have their index in `firestore.indexes.json`; rules changes have emulator tests (`auth-and-roles`)
- [ ] Nothing was built for a BLOCKED decision
- [ ] Checks run locally before opening this PR (there is no CI for now): `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:run` and `npm run build` pass; `npm run test:rules` too if `firestore.rules` changed
