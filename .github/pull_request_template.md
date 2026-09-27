## What changes

Before:

After:

## Stories

KAN-

## Checklist

- [ ] `specs/SPEC.md` exists and this change was checked against it (`backlog-to-spec`)
- [ ] Every acceptance criterion touched has a test named with its KAN key (`unit-testing-standards`)
- [ ] No visible text in code; keys exist in `es` and `en` (`i18n-standards`)
- [ ] Checked in light and dark mode (`theming-standards`)
- [ ] New queries have their index in `firestore.indexes.json`; rules changes have emulator tests (`auth-and-roles`)
- [ ] Nothing was built for a BLOCKED decision
- [ ] `npm run lint && npm run typecheck && npm run test:run` pass
