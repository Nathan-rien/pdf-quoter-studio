

## Problem

Currently, only users with the 'commercial' role get auto-selected entity/commercial and skipped template step. The 'user' role is excluded from this automation.

## Changes

### 1. `src/components/rental-proposal/RentalDataEditor.tsx` (line 36)

Change the lock condition from `isCommercial && !isAdmin` to `!isAdmin && !!commercialId`:

```typescript
const lockCommercialFields = !isAdmin && !!commercialId;
```

This locks entity/commercial fields for both 'commercial' and 'user' roles, but only when they have a matching commercial identity in the database.

### 2. `src/components/rental-proposal/RentalWorkflow.tsx` (line 52)

Change the template skip condition from `isCommercial && !isAdmin` to `!isAdmin && !!commercial?.entity`:

```typescript
const skipTemplateStep = !isAdmin && !!commercial?.entity;
```

This auto-selects the template and hides the template step for both 'commercial' and 'user' roles when they have a known entity.

### 3. No other changes needed

The `useCommercialIdentity` hook already resolves identity by email from `pre_registered_commercials`. The existing `useEffect` guards (`commercial && commercialId`) prevent issues for users without a matching entry. The `ENTITY_TEMPLATE_MAP` mapping remains the same.

