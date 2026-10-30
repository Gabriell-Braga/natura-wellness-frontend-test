# Notes

Decisions and assumptions. No libraries were added.

## Part A: subscription card

- **Amount:** uses `nextChargeTotalCents` from the API instead of recalculating it. Per-item prices are left out because the unit prices are before the discount and would not add up to the total. Each item shows its quantity (×2).
- **Skip confirmation:** opens inline in the card, not as a modal. It shows the current date, the exact new date and the amount. The API has no preview endpoint, so the new date is calculated as `nextChargeAt + intervalDays`, the same rule the API uses. After a successful skip, the card shows the date the server returned.
- **Amount on the new date:** assumed to stay the same, because the items do not change. It shows `nextChargeTotalCents`.
- **After a skip:** a message says what changed in plain words (old date to new date), and the card stays fully usable. Skipping again is allowed, with a new confirmation that shows the new dates. Opening the confirmation clears the previous message.
- **409 conflict:** the confirmation closes, the latest subscription is reloaded, and a message explains that nothing was skipped. The customer sees the updated date before they can confirm again. There is no automatic retry. With `&conflict=always`, every skip will fail on purpose.
- **Other skip errors:** the message says nothing changed and asks the customer to try again. If reloading after a 409 fails, the card falls back to the load error screen with a retry button.
- **Slow requests:** a skeleton while loading. While skipping, the buttons are disabled and say "Skipping…". This also stops double clicks, and the handler ignores calls that are not in the confirming step.
- **Stale responses:** each request takes a ticket number, and only the newest ticket may update the screen. This covers unmount and StrictMode's double effect in dev.
- **Images:** a letter placeholder when `imageUrl` is null or the image fails to load.
- **Paused / cancelled:** a different badge, a summary sentence instead of the charge block, faded images, and no skip button.
- **Dates:** formatted in the customer's local timezone with `Intl`, en-US, for example "Thursday, November 5, 2026". Currency is USD.
- **Accessibility:** messages are in a `role="status"` live region. Focus moves to "Keep my shipment" when the confirmation opens (the safe default) and back to the skip button when it closes. Buttons are at least 48px tall for touch.
- **Layout:** built for 375px first. The card has a maximum width of 480px on larger screens.
- **Checks:** typecheck and build pass. Tested by hand with `active`, `conflict=never`, `conflict=always`, `paused`, `cancelled` and `error`, including skipping twice in a row, and at 375px. No unit tests, as agreed.

## Part B: buy box

- **Measuring:** values come from `public/reference/buy-box.png` (2x, so every pixel value is divided by 2). A throwaway Python/Pillow script, kept outside the repo, read pixel colors and edges. Font sizes and weights were found by rendering the real Inter and Fraunces files at candidate sizes and weights and comparing text width and ink coverage with the reference. Kerning was not applied in those renders, so widths are accurate to about ±1px.
- **Overlay check:** headless Chrome rendered `?part=b` at 1200px wide with a 2x scale. The screenshot was cropped to the buy box, removing the 31.5px nav offset, and then compared with the reference: element by element (bounding boxes), corner profiles, and a whole-image pixel diff. Final result: every element is within 0.5px except the two listed under "Known differences". Mean pixel difference is 0.42/255, and 0.34% of pixels differ by more than 32/255, almost all of it anti-aliasing on text edges.
- **Decided by the overlay (not guessed):**
  - Corner radii: option cards 15px (14 drew too tight and 16 too round), button 12px (exact match; 10 was clearly too small), quantity box 12px (12 and 13 fit equally well, so it matches the button), select 9px, image card 20px.
  - Half pixels: the right column starts 0.5px below the image card (`margin-top: 0.5px` on the eyebrow), the select is 115.5px wide, and the compare price sits 1.5px lower than its line box (`top: 1.5px`).
  - The subtitle has `max-width: 440px`. The reference wraps before "day," even though that word would fit in 468px, and our glyph widths match the reference exactly.
  - Eyebrow letter-spacing is 0.14em, not 0.1em (the text was 3px too narrow). Stars and trust icons are 14px drawings in 16px boxes. The quantity box columns are 46/34/46. The −/+ icons sit 1.25px below centre and the number 1px above, as in the reference.
- **Known differences:** the "Subscribe & save 15%" text sits about 1px higher than in the reference, and the "Add to cart" text about 0.5px lower. Both are sub-pixel and I left them.
- **Selected option:** 1px border plus a 1px inset shadow, so the 2px selected border does not move the content.
- **Behaviour:**
  - Subscribe is selected by default, as in the design.
  - The frequency and perks are shown only when Subscribe is selected.
  - The button shows the selected price × quantity.
  - The fine print is built from the selected frequency and the subscription price × quantity, and is hidden for one-time purchases. `copy.finePrint` hardcodes "30 days" and "$25.46", so the sentence is written in the component.
  - Frequency does not change the price.
  - Quantity is 1–10, and the −/+ buttons are disabled at the limits.
- **Accessibility:**
  - Purchase options are a native radio group inside a `fieldset`, so arrow keys work. The whole option card shows a focus ring.
  - The select is native. The quantity is an `<output>`, so changes are announced.
  - The button has an aria-label ("Add to cart, $25.46").
  - Tap targets are at least 44px. The select is drawn 33px tall as in the design, but the real `<select>` is 44px tall. The reviews link uses padding with a matching negative margin.
- **Responsive:**
  - Below 1200px the layout is one column with a maximum width of 540px and 16px side padding.
  - Checked at 375px and 320px with quantity 10 (the longest button text): no horizontal scroll.
  - At 320px the button moves under the quantity box, because the text no longer fits beside it.
- **Global styles:** `body:has(.bb-page)` removes the default body margin and sets the page background only while the buy box is shown. App and Part A are unchanged.
- **Libraries:** none were added. The measuring and checking scripts (Python/Pillow, plus a Node script using the Chrome DevTools protocol) live outside the repo.

## Not verified (by the AI)

This is the list the AI gave at the end of Part B, copied as it was.

- Browsers: only Chrome. Safari and Firefox weren't tested; font rendering differs, and Firefox needs version 121+ for :has().
- Assistive tech and devices: no real screen reader or touch device. I only checked roles, labels and sizes in the page.
- States with no reference: one-time selected, hover, focus rings and the open dropdown are my own design choices.
- Breakpoint risk: in a real 1200px window with a visible scrollbar, the page is about 1185px wide, which is under the 1200px breakpoint, so it shows the stacked layout. That only happens when the page needs a scrollbar, which needs a window shorter than about 810px. If you'd like the two-column layout to stay down to around 1024px, with a flexible right column, tell me and I'll change it.

I covered some of these points myself afterwards (see "Manual testing by me").

## Manual testing by me

- **Firefox:** everything looked and worked normally.
- **Edge:** everything looked and worked normally.
- **Phone (Samsung Galaxy S25 FE, in Chrome):** everything looked and worked normally.
- **Screen reader (Screen Reader for Chrome extension):** everything was announced normally.
- **Not tested:** Safari.

Nothing looked off. The project is small, so there was not much that could go wrong.
