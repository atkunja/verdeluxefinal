## Admin portal mocks

- Mock domain objects live in `src/mocks/adminPortal.ts` with typed interfaces for leads, bookings, charges, users, accounts, transactions, change requests, revenue metrics, checklist templates, pricing rules, and billing config.
- Thin stub API surface in `src/api/adminPortal.ts` returns the mocks (and pretends to update them). Swap these functions to real HTTP/TRPC calls while keeping the same signatures (e.g. `listLeads`, `updateLeadStatus`, `chargeBooking`, `listTransactions`, `getBillingConfig`).
- Pages consume the stubs directly; replace the imports in the admin routes with real data hooks when wiring Mercury/Stripe.
- Confirmation dialogs are already in place for payment actions and destructive operations—pipe them through real mutations once ready.
- Keep the same shapes for accounts and transactions when connecting Mercury: `Account { id, institution, name, last4, postedBalance, availableBalance, lastSynced }` and `Transaction { id, date, description, accountId, accountName, category, amount, status }`.
