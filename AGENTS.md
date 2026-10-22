# Project architecture rules
- Resolve rental base-rate coefficients and dossier fees through the same pure row resolver; this keeps partner, duration, amount bounds and active-row precedence consistent.
- Distinguish omitted import fees from explicit null and zero through parsing, planning and persistence; this prevents legacy Excel imports from erasing row overrides.
- Use the focused BaseTauxFeesInput and fees-only mutation for inline fee editing; saving a fee must not overwrite a rate or amount range.