# PR Checklist Template

Use this checklist in PR descriptions, review notes, or task completion summaries.

## Summary

- Change:
- User-facing impact:
- Risk level:

## Standards Reviewed

- [ ] `docs/standards/code-style.md`
- [ ] `docs/standards/testing.md`
- [ ] `docs/standards/api-conventions.md`
- [ ] `docs/standards/security.md`

## Code Style

- [ ] New or touched files follow the local naming and module-boundary rules.
- [ ] Shared helpers were reused instead of duplicated.
- [ ] Comments explain intent or constraints, not obvious code.
- [ ] New complexity was isolated instead of pushed into unrelated files.

## Testing

- [ ] Automated tests were added or updated for behavior changes.
- [ ] The smallest correct test layer was used.
- [ ] Relevant commands were run and recorded.

Verification run:

```text
pnpm typecheck
pnpm test:regression
pnpm test:e2e
```

Actual commands run:

```text
<replace with commands actually run>
```

## API Conventions

- [ ] Not applicable
- [ ] Inputs are validated before side effects.
- [ ] Response shapes and error codes stay structured.
- [ ] Shared CORS, rate-limit, or request-ID helpers were reused.
- [ ] Provider calls stay behind clear boundaries.

## Security

- [ ] Inputs are sanitized or normalized at the boundary.
- [ ] Secrets and raw PII are not logged.
- [ ] Security-sensitive behavior has regression coverage.
- [ ] `dangerouslySetInnerHTML` was not introduced without a controlled source and explicit justification.

## Exceptions

- Rule:
- Reason:
- Scope:
- Follow-up:
