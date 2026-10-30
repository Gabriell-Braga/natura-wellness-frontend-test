import { useState } from "react";
import { copy } from "./copy";
import "./BuyBox.css";

const moneyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatMoney = (cents: number) => moneyFormat.format(cents / 100);

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;

type Plan = "one-time" | "subscribe";

export function BuyBox() {
  const [plan, setPlan] = useState<Plan>("subscribe");
  const [frequency, setFrequency] = useState(copy.subscribe.frequencyOptions[0]);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  const unitCents = plan === "subscribe" ? copy.subscribe.priceCents : copy.oneTime.priceCents;
  const total = formatMoney(unitCents * quantity);

  return (
    <main className="bb-page">
      <div className="bb-layout">
        <div className="bb-media">
          <img src="/product.jpg" alt="Natura Wellness Vitamin D bottle, 60 softgels" width={500} height={500} />
        </div>

        <div>
          <p className="bb-eyebrow">{copy.eyebrow}</p>
          <div className="bb-rating">
            <span className="bb-stars" role="img" aria-label={`Rated ${copy.rating} out of 5`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} />
              ))}
            </span>
            <span className="bb-rating-value" aria-hidden="true">
              {copy.rating}
            </span>
            <a className="bb-reviews" href="#reviews">
              {copy.reviewCount}
            </a>
          </div>
          <h1 className="bb-title">{copy.title}</h1>
          <p className="bb-subtitle">{copy.subtitle}</p>
          <hr className="bb-divider" />

          {/* A real radio group: arrow keys move between options, Tab leaves the group. */}
          <fieldset className="bb-options">
            <legend className="bb-visually-hidden">Purchase option</legend>

            <div className={`bb-option${plan === "one-time" ? " is-selected" : ""}`}>
              <label className="bb-option-head">
                <input
                  className="bb-radio"
                  type="radio"
                  name="plan"
                  value="one-time"
                  checked={plan === "one-time"}
                  onChange={() => setPlan("one-time")}
                />
                <span className="bb-option-label">{copy.oneTime.label}</span>
                <span className="bb-option-price">{formatMoney(copy.oneTime.priceCents)}</span>
              </label>
            </div>

            <div className={`bb-option${plan === "subscribe" ? " is-selected" : ""}`}>
              <label className="bb-option-head">
                <input
                  className="bb-radio"
                  type="radio"
                  name="plan"
                  value="subscribe"
                  checked={plan === "subscribe"}
                  onChange={() => setPlan("subscribe")}
                />
                <span className="bb-option-label">
                  {copy.subscribe.label}
                  <span className="bb-badge">{copy.subscribe.badge}</span>
                </span>
                <span className="bb-option-price">
                  {formatMoney(copy.subscribe.priceCents)}
                  <s className="bb-compare">
                    <span className="bb-visually-hidden">Regular price </span>
                    {formatMoney(copy.subscribe.comparePriceCents)}
                  </s>
                </span>
              </label>

              {plan === "subscribe" && (
                <div className="bb-option-body">
                  <div className="bb-frequency">
                    <label htmlFor="bb-frequency">{copy.subscribe.frequencyLabel}</label>
                    <span className="bb-select">
                      <select id="bb-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                        {copy.subscribe.frequencyOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                      <svg className="bb-chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
                        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <ul className="bb-perks">
                    {copy.subscribe.perks.map((perk) => (
                      <li key={perk}>
                        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                          <path d="M3 7.5l3 3.25L12 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </fieldset>

          <div className="bb-purchase">
            <div className="bb-quantity" role="group" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= MIN_QUANTITY}
                onClick={() => setQuantity((q) => Math.max(MIN_QUANTITY, q - 1))}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M0 5h10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <output aria-live="polite">{quantity}</output>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M0 5h10M5 0v10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <button type="button" className="bb-cart" aria-label={`${copy.addToCart}, ${total}`}>
              {copy.addToCart}
              <span className="bb-dot">·</span>
              {total}
            </button>
          </div>

          <ul className="bb-trust">
            {copy.trust.map((item) => (
              <li key={item}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.25 8.25l1.9 1.9 3.6-3.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {/* copy.finePrint hardcodes "30 days" and "$25.46", so the sentence is rebuilt from the live selection. */}
          {plan === "subscribe" && (
            <p className="bb-fine-print">
              Your subscription renews every {frequency} at {total} until you cancel. Skip or cancel anytime from your account.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="2 2 20 20" aria-hidden="true">
      <path fill="currentColor" d="M12 2.5l2.94 6.26 6.86.78-5.1 4.68 1.4 6.78L12 17.56 5.9 21l1.4-6.78-5.1-4.68 6.86-.78z" />
    </svg>
  );
}
