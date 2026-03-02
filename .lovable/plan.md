

## Problem

The dental PDF parser fails to extract **any** product lines from English "Quotation" format PDFs because the regex pattern `Unit[eé]` requires "e" or "é" after "Unit". The English format uses **"Unit(s)"** (no "e"), so the pattern never matches and zero products are extracted into the Invest tab.

## Root Cause

Six regex occurrences use `Unit[eé]` which matches "Unité(s)" and "Unite(s)" but **not** "Unit(s)":
- Line 1394: column-based row filter
- Line 1397: column boundary finder  
- Line 1498: `productLinePattern` in multi-line parser
- Line 1573: new-product stop condition
- Line 1710: client fallback skip pattern
- Line 1390: header skip (needs English variants: `Subtotal`, `Quantity`, `Unit Price`, `Amount`)

## Fix — `src/lib/pdf-import-parser.ts`

Change `Unit[eé]` → `Unit[eé]?` (make the e/é **optional**) in all 6 locations. This way "Unit(s)", "Unité(s)", and "Unite(s)" all match.

Also update the column-based header skip (line 1390) to include English headers: `Subtotal`, `Quantity`, `Unit\s*Price`, `Amount`, `Untaxed`.

Single file change, ~6 line edits.

