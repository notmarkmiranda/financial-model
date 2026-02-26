# Multi-Bay Support Design

## Overview

Add a 1–3 bay selector to the Golf Simulator Financial Model. All existing inputs describe a single bay's economics; the model scales revenue and costs accordingly.

## UI

New "Number of Bays" section at the top of the left panel using the same button toggle style as the simulator tier selector. Three buttons: `1 Bay`, `2 Bays`, `3 Bays`. All other inputs unchanged.

## Revenue Scaling

All revenue (hourly + membership) multiplies by `bayCount`. Inputs describe one bay; all bays assumed to operate identically.

## Monthly Expense Scaling

| Cost | Scaling |
|---|---|
| Rent, Utilities, Cleaning, Maintenance, Misc | × bayCount |
| Insurance | $200 base + $50 per bay |
| Internet, Software, Marketing | flat (shared) |

## Startup Cost Scaling

| Cost | Scaling |
|---|---|
| Simulator + enclosure, Buildout | × bayCount |
| Lease deposit, Legal, Tech, Signage, Launch marketing, Contingency | flat |

## Output

All summary cards (monthly revenue, profit, startup cost, payback period), break-even analysis, and 12-month cash flow table reflect the full multi-bay operation.
