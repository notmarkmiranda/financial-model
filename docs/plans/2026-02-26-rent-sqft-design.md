# Rent $/sqft Design

## Overview

Replace the single "Monthly Rent" slider with three sliders: base rent ($/sqft/yr), square footage, and NNN ($/sqft/yr). Monthly rent is derived from these inputs.

## UI Changes

Replace the `Monthly Rent` slider in the `Space & Buildout` section with:

| Slider | Range | Default |
|---|---|---|
| Base rent ($/sqft/yr) | $5–$80 | $25 |
| Square footage | 200–3,000 sqft | 800 |
| NNN ($/sqft/yr) | $0–$20 | $5 |

Show a computed display line below: `Monthly Rent: $X,XXX` derived from the three inputs.

## Derived Value

```
totalMonthlyRent = ((rentPerSqft + nnnPerSqft) * sqft) / 12
```

Computed inside `useMemo`. Used everywhere `rent` was previously used: `expenses.rent` and `startup.leaseDeposit`.

## State Changes

Remove: `rent` state
Add: `rentPerSqft` (default 25), `sqft` (default 800), `nnnPerSqft` (default 5)

`totalMonthlyRent` is not state — it's derived inside `useMemo` and returned for display.
