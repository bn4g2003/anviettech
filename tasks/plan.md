# Implementation Plan: Contract management, customer visibility, search, and remarketing

## Overview

Complete the requested CRM workflow in four independent modules: manage contracts manually while retaining automatic contracts from approved quotes; enforce the My Customers view by record ownership; standardize fast search across the requested modules; and add a deal-level remarketing history with follow-up scheduling.

## Capability Map

| Module | Responsibility | Depends on |
| --- | --- | --- |
| contract-management | Create, edit, and list contracts; preserve quote-created contracts | existing customers, quotes, owners |
| customer-visibility | Apply owner-based scope consistently to My Customers | existing permissions and customer ownership |
| fast-search | Expose consistent quick-search inputs and server search | existing list APIs |
| deal-remarketing | Store and show follow-up history for a deal | activities, deals, permissions |

Build order: contract-management → customer-visibility and fast-search → deal-remarketing.

## Architecture Decisions

- Ownership means `owner_id`, not `created_by`: it is already the access-control key in customer endpoints and remains valid after reassignment.
- An approved quote remains the only automated source of a linked contract. Manual contracts have no `quote_id` and are independently editable.
- Remarketing records extend the existing `activities` resource, linked by `deal_id`, with a required follow-up status and optional next-follow-up date. This avoids a duplicate timeline model.
- Every permission rule is enforced by API routes; UI visibility is convenience only.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing contracts are quote-linked | High | Do not allow changing linked customer/quote fields after creation. |
| Scope semantics are misunderstood | High | Use the existing `owner_id` authorization model and document it in the UI. |
| Remarketing needs new persisted fields | Medium | Add an additive migration and validation; preserve all existing activities. |
| Search differs between modules | Medium | Reuse list API `search` parameter and add regression tests for each server query. |

## Verification

- Focused Vitest tests for validation, permissions, and query/transition helpers.
- `npm test`, `npx tsc --noEmit`, and `npm run lint` after each completed slice.
- Manual verification: create/edit a contract, view My Customers as a sales rep and manager, search all four lists, and add a remarketing entry to a deal.
