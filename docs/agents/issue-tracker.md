# Issue tracker: GitHub

Issues for this repository live in GitHub under `felipewilliam2/AV-SITE`. Use
the `gh` CLI for issue operations and infer the repository from the configured
Git remote when possible.

## Conventions

- Create, read, update, label, comment on, and close work through GitHub Issues.
- Pull requests are not a request or triage surface. They remain the delivery
  mechanism for work already represented by an issue.
- When publishing agent-ready tickets, apply the tracker label mapped from
  `ready-for-agent` in `docs/agents/triage-labels.md`.
- Use GitHub sub-issues when one independently useful parent outcome genuinely
  contains multiple executable slices. Do not create hierarchy merely for
  presentation.
- Use GitHub native issue dependencies for blocking edges. If that API is not
  available, place an explicit `Blocked by: #<number>` section in the issue.
- A ticket is on the execution frontier when all its blockers are closed and it
  is not already assigned.

## Pull requests as a triage surface

**No.** External pull requests do not enter the issue triage state machine.

## Skill operations

- When a skill says to publish to the issue tracker, create a GitHub issue.
- When a skill says to fetch a ticket, read its full body, labels, and comments.
- GitHub shares one number space across issues and pull requests; resolve an
  ambiguous reference before acting on it.
