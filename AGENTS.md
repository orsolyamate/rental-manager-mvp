<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All database reads and writes go through `createServerFn` handlers using `createPublicDbClient()` (`src/lib/public-db.ts`), so RLS applies and no auth is needed; writes validate with the shared zod schema server-side too.
- The effective-fee rule lives only in `getEffectiveEntry` (`src/lib/fees.ts`); every screen that needs a month's rent or common cost must call it, never re-implement it.
- Shared money/date rules and HUF/date formatting live in `src/lib/common.ts` (`amountSchema`, `requiredDateSchema`, `formatHuf`, `formatDate`); fees and invoices must reuse them so validation and display stay identical.
- Invoice paid/paid_date consistency is enforced in three layers (zod schemas, RLS INSERT/UPDATE checks, table CHECK); keep all three in sync when changing it.
- Invoices are updatable only through a column-level grant (`paid`, `paid_date`); never widen it to a table-level UPDATE grant. `scripts/check-invoice-permissions.sh` verifies this against the live database as the anon role; run it after any invoice permission change.
- Fee history is append-only: no UPDATE/DELETE grants, one value per apartment per valid_from date.
- Every new public table must REVOKE the platform's default anon/authenticated privileges and GRANT back only what its policies need; defaults otherwise allow writes.
- Main navigation items live in `src/lib/nav.ts`; header and route tests read from it so menu and routes stay in sync.
- Monthly settlement is computed on the fly by `computeSettlement` (`src/lib/settlement.ts`) from fee history and invoices; never store settlements in a table. A missing rent or common cost yields `total: null`, never a 0-based total. The selected month lives in the `?honap=YYYY-MM` search param.
