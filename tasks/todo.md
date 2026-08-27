# CRM implementation tasks

## Contract management

- [ ] Add manual contract create/update API and validation.
  - Acceptance: authorized users can create a contract for a customer; approved-quote contracts remain linked and protected.
  - Verify: focused contract tests and API validation tests.
  - Dependencies: none.

- [ ] Add contract create/edit UI and connect it to the contracts API.
  - Acceptance: the Contracts page exposes Create; draft/manual contracts can be edited according to permissions.
  - Verify: component logic tests, TypeScript, and manual flow.
  - Dependencies: manual contract API.

## Customer visibility and search

- [ ] Enforce and expose owner-scoped My Customers view.
  - Acceptance: sales users receive only records where `owner_id` is theirs; managers/admins receive all permitted customers.
  - Verify: permission/list query tests.
  - Dependencies: none.

- [ ] Standardize fast search for leads, customers, quotes, and contracts.
  - Acceptance: each listed module has a quick-search input connected to its existing list API.
  - Verify: search query tests and manual checks.
  - Dependencies: none.

## Deal remarketing

- [ ] Build remarketing from existing deal activities and follow-up tasks.
  - Acceptance: a deal-linked interaction is recorded as an activity and an optional next appointment is stored as a follow-up task.
  - Verify: validation and API checks; no database migration required.
  - Dependencies: none.

- [ ] Add deal remarketing timeline and creation dialog.
  - Acceptance: users with access to the deal can add entries and see newest-first history with next follow-up date.
  - Verify: focused tests and manual flow.
  - Dependencies: remarketing API contract.

## Checkpoints

- [ ] After contract management: tests, TypeScript, lint, and manual create/edit check pass.
- [ ] After visibility/search: tests, TypeScript, lint, and role/search checks pass.
- [ ] After remarketing: tests, TypeScript, lint, migration, and full deal timeline flow pass.
