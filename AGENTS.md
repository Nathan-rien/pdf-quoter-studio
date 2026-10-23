# Project architecture rules
- Resolve rental base-rate coefficients and dossier fees through the same pure row resolver; this keeps partner, duration, amount bounds and active-row precedence consistent.
- Distinguish omitted import fees from explicit null and zero through parsing, planning and persistence; this prevents legacy Excel imports from erasing row overrides.
- Use the focused BaseTauxFeesInput and fees-only mutation for inline fee editing; saving a fee must not overwrite a rate or amount range.
- Intervention notifications are emitted only by database triggers through create_notification; browser clients can only read their own notifications and change is_read.
- Contract intervention reports use the shared interventions-recap helpers and html-to-pdf engine; keep CSV and PDF period filters and status totals consistent.- Transactional quote PDFs/HTML are rendered only from the whitelisted print model (toPrintModel in src/lib/transac-html-generator.ts); internal purchase/margin fields must never reach the generator.
