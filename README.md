# Natura Wellness frontend test

Natura Wellness is a fictional brand made up for this test. The full brief is in `INSTRUCTIONS.md`.

```
npm install
npm run dev
```

- **Part A:** `src/part-a/SubscriptionCard.tsx`. Open `/?part=a&fixture=active`. The mock API is in `src/api/`; switch cases with `?fixture=active|paused|cancelled|error` and force the "changed elsewhere" error with `&conflict=always`.
- **Part B:** `src/part-b/BuyBox.tsx`. Open `/?part=b`. Match `public/reference/buy-box.png`, which is a 2x screenshot of a 1200px-wide browser window. Copy is in `src/part-b/copy.ts`; Fraunces and Inter are loaded in `index.html`.

You can add any libraries you like.

## My submission

### Run it

```
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```

- Part A: `/?part=a&fixture=active`. Also try `paused`, `cancelled`, `error`, `&conflict=always` and `&conflict=never`.
- Part B: `/?part=b`

### What was built

- **Part A: subscription card** (`src/part-a/`)
  - Shows the next charge date and amount (`nextChargeTotalCents` from the API), and the products with their quantities.
  - Skip asks for confirmation inline. The confirmation shows the exact new date and the amount.
  - After a successful skip, the card says what changed (old date to new date) and stays usable.
  - A 409 closes the confirmation, reloads the latest data and asks the customer to try again. There is no automatic retry.
  - Also covered: loading state, load error with retry, double clicks, stale responses, missing images, and paused and cancelled states with no skip button.
  - Built for 375px first.
- **Part B: buy box** (`src/part-b/`)
  - Rebuilt from the reference. Colors, sizes and spacing were measured from the 2x screenshot and then checked with a rendered overlay at 1200px; elements are within 0.5px.
  - Working radio group, frequency select and quantity stepper. The button price and the fine print update with the selection.
  - Stacks into one column below 1200px, with no horizontal scroll at 375px or 320px.

No libraries were added. Plain CSS, one file per part.

### Assumptions

- The amount charged on the date after a skip is the same `nextChargeTotalCents`, because the items don't change.
- The new date in the skip confirmation is `nextChargeAt + intervalDays`, the same rule as the API. The date shown after the skip comes from the server.
- Dates use the customer's timezone, in en-US format. Prices are in USD.
- Part B:
  - Subscribe is selected by default.
  - Frequency changes only the text, not the price.
  - Quantity is 1–10.
  - The fine print uses the subscription price × quantity and is hidden for one-time purchases.
- With `fixture=error` and `conflict=always`, every request fails on purpose.

Full decisions and measurements are in [NOTES.md](NOTES.md).
