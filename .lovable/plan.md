

## Problem

The designation text in the Invest product table doesn't preserve line breaks in the preview or PDF export. Line 1037 of `RentalProposalPreview.tsx` uses `whitespace-normal` which collapses `\n` characters into spaces. The export (`RentalProposalExport.tsx` line 382) also lacks `white-space: pre-wrap`.

## Changes

### 1. `src/components/rental-proposal/RentalProposalPreview.tsx` (line 1037)

Replace `whitespace-normal` with `whitespace-pre-wrap` on the designation cell:

```tsx
<div className="col-span-6 break-words whitespace-pre-wrap leading-tight py-0.5">
```

### 2. `src/components/rental-proposal/RentalProposalExport.tsx` (line 382)

Add `white-space: pre-wrap;` to the designation `<td>` inline style:

```html
<td style="padding: ...; border-bottom: ...; word-wrap: break-word; white-space: pre-wrap; max-width: 60%;">
```

These two changes ensure newline characters entered in the Invest tab are rendered as visible line breaks in both the preview and the exported PDF.

